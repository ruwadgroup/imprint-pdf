import type { RenderOptions } from '@imprint-pdf/core';
import type { ReactElement } from 'react';
import type { PdfOptions } from './pdf.js';

export type { PdfOptions, PdfOutput } from './pdf.js';

export interface StandaloneRenderOptions extends RenderOptions {
  // v1: will be wired to taffy layout engine and harfbuzz text shaper
  wasm?: WebAssembly.Module;
}

export async function renderToStream(
  element: ReactElement,
  options: StandaloneRenderOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const { wasm: _wasm, ...renderOptions } = options;
  const { renderToStream: render } = await import('./render.js');
  return render(element, renderOptions);
}

export async function renderToBuffer(
  element: ReactElement,
  options: StandaloneRenderOptions = {},
): Promise<Uint8Array> {
  const { wasm: _wasm, ...renderOptions } = options;
  const { renderToBuffer: render } = await import('./render.js');
  return render(element, renderOptions);
}

/**
 * Unified entry point — see `@imprint-pdf/react`'s docs for the overloads.
 * Edge variant: skips config auto-load (no `node:fs`), so always pass
 * `options.fonts` and `options.tailwind` explicitly on edge.
 */
export function pdf(
  element: ReactElement,
  options?: PdfOptions & { wasm?: WebAssembly.Module; as?: 'response' },
): Promise<Response>;
export function pdf(
  element: ReactElement,
  options: PdfOptions & { wasm?: WebAssembly.Module; as: 'bytes' },
): Promise<Uint8Array>;
export function pdf(
  element: ReactElement,
  options: PdfOptions & { wasm?: WebAssembly.Module; as: 'stream' },
): Promise<ReadableStream<Uint8Array>>;
export async function pdf(
  element: ReactElement,
  options: PdfOptions & { wasm?: WebAssembly.Module } = {},
): Promise<Response | Uint8Array | ReadableStream<Uint8Array>> {
  const { wasm: _wasm, ...rest } = options;
  const mod = (await import('./pdf.js')) as {
    pdf: (
      e: ReactElement,
      o?: PdfOptions,
    ) => Promise<Response | Uint8Array | ReadableStream<Uint8Array>>;
  };
  return mod.pdf(element, rest);
}
