import type { RenderOptions } from '@imprint-pdf/core';
import type { PdfOptions } from '@imprint-pdf/react';
import type { ReactElement } from 'react';

export type { RenderOptions } from '@imprint-pdf/core';
export type { PdfOptions, PdfOutput } from '@imprint-pdf/react';

/**
 * Render a React element to a PDF — the recommended entry point.
 *
 * Auto-loads `imprint.config.ts` from the project root (Node only), merges
 * caller options on top, and picks the right `@imprint-pdf/react` build for
 * the runtime: Node bundle for `runtime = 'nodejs'` (default), standalone
 * edge bundle for `runtime = 'edge'`.
 *
 * @example
 * ```ts
 * // app/api/invoice/route.ts — Response output by default
 * export const GET = () => pdf(<Invoice />);
 *
 * // Escape hatches
 * const bytes  = await pdf(<Doc />, { as: 'bytes'  });
 * const stream = await pdf(<Doc />, { as: 'stream' });
 * ```
 */
export function pdf(
  element: ReactElement,
  options?: PdfOptions & { as?: 'response' },
): Promise<Response>;
export function pdf(
  element: ReactElement,
  options: PdfOptions & { as: 'bytes' },
): Promise<Uint8Array>;
export function pdf(
  element: ReactElement,
  options: PdfOptions & { as: 'stream' },
): Promise<ReadableStream<Uint8Array>>;
export async function pdf(
  element: ReactElement,
  options: PdfOptions = {},
): Promise<Response | Uint8Array | ReadableStream<Uint8Array>> {
  const mod = (await loadReactEntry()) as {
    pdf: (
      e: ReactElement,
      o?: PdfOptions,
    ) => Promise<Response | Uint8Array | ReadableStream<Uint8Array>>;
  };
  return mod.pdf(element, options);
}

// The Node entry pulls in pdf-lib's native bindings; `/standalone` ships
// WASM with no `node:*` imports. Next sets `NEXT_RUNTIME=edge` on edge routes;
// `globalThis.EdgeRuntime` is the generic Vercel/Cloudflare signal.
function isEdgeRuntime(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME === 'edge') return true;
  return typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime !== 'undefined';
}

function loadReactEntry(): Promise<unknown> {
  return isEdgeRuntime() ? import('@imprint-pdf/react/standalone') : import('@imprint-pdf/react');
}

/** @deprecated Use `pdf(element, { as: 'bytes' })` instead. */
export function renderToServer(
  element: ReactElement,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  return pdf(element, { ...options, as: 'bytes' });
}

export interface EdgeRenderOptions extends RenderOptions {
  /** Pre-compiled WebAssembly module for the PDF renderer. */
  wasm?: WebAssembly.Module;
}

/** @deprecated Use `pdf(element, { as: 'stream' })` from a route with `runtime = 'edge'`. */
export function renderToEdge(
  element: ReactElement,
  options: EdgeRenderOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const { wasm: _wasm, ...rest } = options;
  return pdf(element, { ...rest, as: 'stream' });
}

export interface PdfResponseOptions extends RenderOptions {
  /** Suggested filename in the `Content-Disposition` header. */
  filename?: string;
  /** `'inline'` displays in the browser, `'attachment'` triggers download. */
  disposition?: 'inline' | 'attachment';
}

/** @deprecated Use `pdf(element, { filename, disposition })` instead. */
export function createPdfResponse(
  element: ReactElement,
  options: PdfResponseOptions = {},
): Promise<Response> {
  return pdf(element, options);
}
