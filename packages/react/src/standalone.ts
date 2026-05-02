import type { RenderOptions } from '@imprint-pdf/core';
import type { ReactElement } from 'react';

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
