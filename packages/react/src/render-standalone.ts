import type { RenderOptions, ResolvedStyle } from '@imprint-pdf/core/browser';
import type { ReactElement } from 'react';
import { type InspectorRenderResult, renderInternal } from './render-browser-pipeline.js';

export type { InspectorRenderResult } from './render-browser-pipeline.js';

async function resolveStandaloneTailwindClassMap(
  classes: Set<string>,
  options: RenderOptions,
): Promise<Map<string, ResolvedStyle> | undefined> {
  const canReadBrowserStyles = typeof document !== 'undefined' && typeof window !== 'undefined';

  if (canReadBrowserStyles) {
    const { resolveBrowserClassMap } = await import('@imprint-pdf/tailwind/runtime');
    return resolveBrowserClassMap(classes);
  }

  if (options.tailwind) {
    throw new Error(
      '[imprint] Runtime Tailwind compilation is only available in the Node entry. ' +
        'Use @imprint-pdf/react on the server, render in a browser with Tailwind CSS loaded, or pass options.tailwind.classMap.',
    );
  }

  return undefined;
}

export async function renderToBuffer(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  const { pdf } = await renderInternal(
    element,
    options,
    resolveStandaloneTailwindClassMap,
    (opts) => Boolean(opts.tailwind) || typeof document !== 'undefined',
  );
  return pdf;
}

/**
 * Render to a chunked `ReadableStream<Uint8Array>`.
 *
 * pdf-lib builds the buffer in one shot, but chunking lets frameworks flush
 * `Content-Type: application/pdf` headers and bytes immediately.
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

export function renderForInspector(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<InspectorRenderResult> {
  return renderInternal(
    element,
    options,
    resolveStandaloneTailwindClassMap,
    (opts) => Boolean(opts.tailwind) || typeof document !== 'undefined',
  );
}
