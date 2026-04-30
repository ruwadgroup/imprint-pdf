import type { DocumentNode, RenderOptions } from '@imprint/core';
import {
  clearCompiledClassMap,
  collectClassNames,
  createAssetResolver,
  loadFontMetricsOnly,
  runLayout,
  setCompiledClassMap,
  writePdf,
} from '@imprint/core';
import type { ReactElement } from 'react';
import { buildPdfNodeTree } from './reconciler.js';

export async function renderToBuffer(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  const resolver = options.assetResolver ?? createAssetResolver();

  // Two-pass Tailwind pipeline: when options.tailwind is provided, do a dry
  // reconcile first to collect all className strings, compile them via the real
  // Tailwind Oxide compiler, then inject the result into the module-level cache
  // before the real render so resolveClassName uses compiled values.
  if (options.tailwind) {
    const { runTailwind } = await import('@imprint/tailwind');
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
    const rootNode = buildPdfNodeTree(element);

    if (rootNode.type !== 'document') {
      throw new Error(
        `[imprint] renderToBuffer: root element must be <Document> (got type="${rootNode.type}"). Wrap your content in <Document>.`,
      );
    }
    const documentNode = rootNode as DocumentNode;

    const fontMetrics = await loadFontMetricsOnly(options.fonts ?? [], resolver);
    const geometries = await runLayout(documentNode, 0, 0, fontMetrics);
    return writePdf(documentNode, geometries, options.fonts ?? [], resolver);
  } finally {
    if (options.tailwind) clearCompiledClassMap();
  }
}

export async function renderToStream(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const buffer = await renderToBuffer(element, options);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(buffer);
      controller.close();
    },
  });
}
