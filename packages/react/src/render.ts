import type { ComputedGeometry, DocumentNode, PdfNode, RenderOptions } from '@imprint-pdf/core';
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
} from '@imprint-pdf/core';
import type { ReactElement } from 'react';
import { buildPdfNodeTree } from './reconciler.js';

export interface InspectorRenderResult {
  pdf: Uint8Array;
  tree: DocumentNode;
  geometries: Map<string, ComputedGeometry>;
}

async function renderInternal(
  element: ReactElement,
  options: RenderOptions,
): Promise<InspectorRenderResult> {
  const resolver = options.assetResolver ?? createAssetResolver();

  // Two-pass reconcile to break the Tailwind ↔ resolved-style cycle: dry pass
  // harvests class names, second pass reconciles with the compiled map.
  if (options.tailwind) {
    const { runTailwind } = await import('@imprint-pdf/tailwind');
    const dryRoot = await buildPdfNodeTree(element);
    const classes = collectClassNames(dryRoot);
    if (classes.size > 0) {
      const projectRoot = (options.tailwind as { projectRoot?: string }).projectRoot;
      if (!projectRoot) {
        throw new Error(
          '[imprint] options.tailwind.projectRoot is required when using Tailwind. ' +
            'Set it to the directory containing your tailwind config / package.json.',
        );
      }
      const compiled = await runTailwind(classes, options.tailwind, projectRoot);
      setCompiledClassMap(compiled);
    }
  }

  try {
    const rootNode: PdfNode = await buildPdfNodeTree(element);

    if (rootNode.type !== 'document') {
      throw new Error(
        `[imprint] renderToBuffer: root element must be <Document> (got type="${rootNode.type}"). Wrap your content in <Document>.`,
      );
    }
    // Fold page-* / imprint-* variants into each node's style before layout.
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
    if (options.tailwind) clearCompiledClassMap();
    clearHyphenator();
    clearSvgRasterizer();
  }
}

export async function renderToBuffer(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  const { pdf } = await renderInternal(element, options);
  return pdf;
}

/**
 * Render to a chunked `ReadableStream<Uint8Array>`.
 *
 * pdf-lib builds the buffer in one shot, but chunking lets frameworks flush
 * `Content-Type: application/pdf` headers and bytes immediately — matters for
 * sub-100ms TTFB on edge runtimes. 64 KB chunks match Node's default
 * high-water mark.
 */
export async function renderToStream(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const buffer = await renderToBuffer(element, options);
  const CHUNK = 64 * 1024;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < buffer.length; offset += CHUNK) {
        controller.enqueue(buffer.subarray(offset, Math.min(offset + CHUNK, buffer.length)));
      }
      controller.close();
    },
  });
}

/**
 * Render and return the bytes plus the post-layout tree and per-node geometry.
 * Powers `imprint dev`'s inspector; not part of the public render API.
 */
export function renderForInspector(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<InspectorRenderResult> {
  return renderInternal(element, options);
}
