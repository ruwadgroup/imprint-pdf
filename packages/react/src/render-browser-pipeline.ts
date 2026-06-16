import type {
  ComputedGeometry,
  DocumentNode,
  PdfNode,
  RenderOptions,
  ResolvedStyle,
  TailwindClassMapInput,
} from '@imprint-pdf/core/browser';
import {
  applyImprintVariants,
  clearCompiledClassMap,
  clearHyphenator,
  clearSvgRasterizer,
  collectClassNames,
  createAssetResolver,
  loadFontMetricsOnly,
  runLayout,
  setCompiledClassMap,
  setHyphenator,
  setSvgRasterizer,
  writePdf,
} from '@imprint-pdf/core/browser';
import type { ReactElement } from 'react';
import { buildPdfNodeTree } from './reconciler.js';

export interface InspectorRenderResult {
  pdf: Uint8Array;
  tree: DocumentNode;
  geometries: Map<string, ComputedGeometry>;
}

export type TailwindClassMapResolver = (
  classes: Set<string>,
  options: RenderOptions,
) => Promise<Map<string, ResolvedStyle> | undefined>;

export type ShouldResolveTailwindClassMap = (options: RenderOptions) => boolean;

function normalizeClassMap(input: TailwindClassMapInput | undefined): Map<string, ResolvedStyle> {
  if (!input) return new Map();
  return input instanceof Map ? input : new Map(Object.entries(input));
}

export async function renderInternal(
  element: ReactElement,
  options: RenderOptions,
  resolveTailwindClassMap: TailwindClassMapResolver,
  shouldResolveTailwindClassMap: ShouldResolveTailwindClassMap,
): Promise<InspectorRenderResult> {
  const resolver = options.assetResolver ?? createAssetResolver();
  let hasCompiledClassMap = false;

  const providedClassMap = normalizeClassMap(options.tailwind?.classMap);
  if (providedClassMap.size > 0) {
    setCompiledClassMap(providedClassMap);
    hasCompiledClassMap = true;
  } else if (shouldResolveTailwindClassMap(options)) {
    const dryRoot = await buildPdfNodeTree(element);
    const classes = collectClassNames(dryRoot);
    if (classes.size > 0) {
      const compiled = await resolveTailwindClassMap(classes, options);
      if (compiled && compiled.size > 0) {
        setCompiledClassMap(compiled);
        hasCompiledClassMap = true;
      }
    }
  }

  try {
    const rootNode: PdfNode = await buildPdfNodeTree(element);

    if (rootNode.type !== 'document') {
      throw new Error(
        `[imprint] renderToBuffer: root element must be <Document> (got type="${rootNode.type}"). Wrap your content in <Document>.`,
      );
    }

    const documentNode = applyImprintVariants(rootNode as DocumentNode);

    if (options.hyphenate) setHyphenator(options.hyphenate);
    if (options.svgRasterizer) setSvgRasterizer(options.svgRasterizer);

    const fonts = options.fonts ?? [];
    const fontMetrics = await loadFontMetricsOnly(fonts, resolver, options.onAssetError);
    const geometries = await runLayout(documentNode, 0, 0, fontMetrics);
    const pdf = await writePdf(documentNode, geometries, fonts, resolver, {
      ...(options.postProcess && { postProcess: options.postProcess }),
      ...(options.postBytes && { postBytes: options.postBytes }),
      ...(options.onAssetError && { onAssetError: options.onAssetError }),
    });
    return { pdf, tree: documentNode, geometries };
  } finally {
    if (hasCompiledClassMap) clearCompiledClassMap();
    clearHyphenator();
    clearSvgRasterizer();
  }
}
