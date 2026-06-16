import type { RenderOptions, ResolvedStyle } from '@imprint-pdf/core';
import type { ReactElement } from 'react';
import { type InspectorRenderResult, renderInternal } from './render-pipeline.js';

export type { InspectorRenderResult } from './render-pipeline.js';

async function resolveNodeTailwindClassMap(
  classes: Set<string>,
  options: RenderOptions,
): Promise<Map<string, ResolvedStyle> | undefined> {
  if (!options.tailwind) return undefined;
  const projectRoot = options.tailwind.projectRoot;
  if (!projectRoot) {
    throw new Error(
      '[imprint] options.tailwind.projectRoot is required when using Tailwind on the server. ' +
        'Set it to the directory containing your tailwind config / package.json, or pass options.tailwind.classMap.',
    );
  }
  const { runTailwind } = await import('@imprint-pdf/tailwind');
  return runTailwind(classes, options.tailwind, projectRoot);
}

export async function renderToBuffer(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  const { pdf } = await renderInternal(element, options, resolveNodeTailwindClassMap, (opts) =>
    Boolean(opts.tailwind),
  );
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
  return renderInternal(element, options, resolveNodeTailwindClassMap, (opts) =>
    Boolean(opts.tailwind),
  );
}
