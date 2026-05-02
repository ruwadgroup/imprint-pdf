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

  // Two-pass reconcile to break the Tailwind ↔ resolved-style cycle: dry
  // pass to harvest class names, then reconcile again with the compiled map.
  if (options.tailwind) {
    const { runTailwind } = await import('@imprint-pdf/tailwind');
    const dryRoot = buildPdfNodeTree(element);
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
    const rootNode: PdfNode = buildPdfNodeTree(element);

    if (rootNode.type !== 'document') {
      throw new Error(
        `[imprint] renderToBuffer: root element must be <Document> (got type="${rootNode.type}"). Wrap your content in <Document>.`,
      );
    }
    // Fold page-* / imprint-* variants into each node's style before layout.
    const documentNode = applyImprintVariants(rootNode as DocumentNode);

    if (options.hyphenate) setHyphenator(options.hyphenate);
    if (options.svgRasterizer) setSvgRasterizer(options.svgRasterizer);

    const fontMetrics = await loadFontMetricsOnly(options.fonts ?? [], resolver);
    const geometries = await runLayout(documentNode, 0, 0, fontMetrics);
    const pdf = await writePdf(documentNode, geometries, options.fonts ?? [], resolver, {
      ...(options.postProcess && { postProcess: options.postProcess }),
      ...(options.postBytes && { postBytes: options.postBytes }),
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
 * Renders the document and returns the bytes as a chunked `ReadableStream`.
 *
 * pdf-lib produces the buffer in one shot, so the chunking here is a
 * downstream-friendly optimisation: it lets HTTP frameworks send the
 * `Content-Type: application/pdf` headers and start flushing bytes
 * immediately, which matters for sub-100 ms TTFB targets on edge runtimes
 * (Cloudflare Workers, Vercel Edge, Deno Deploy, Bun). 64 KB chunks match
 * Node's default high-water mark and keep memory usage flat for large PDFs.
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
 * Single-pass render that returns the PDF bytes alongside the post-layout
 * PdfNode tree and per-node geometry map. Powers `imprint dev`'s inspector;
 * not part of the public render API.
 */
export async function renderForInspector(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<InspectorRenderResult> {
  return renderInternal(element, options);
}
