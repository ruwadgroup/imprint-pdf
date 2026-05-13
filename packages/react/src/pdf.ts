import type { RenderOptions } from '@imprint-pdf/core';
import type { ReactElement } from 'react';
import { mergeWithConfig } from './config-loader.js';
import { renderToBuffer, renderToStream } from './render.js';

/**
 * Output shape for {@link pdf}.
 *
 * - `'response'` (default) — a `Response` with PDF bytes and the right
 *   `Content-Type` / `Content-Disposition` headers. Drop into Next.js route
 *   handlers, Hono, Bun.serve, etc.
 * - `'bytes'` — a `Uint8Array`. For writing to disk, attaching to email, or
 *   passing into a custom HTTP framework.
 * - `'stream'` — a `ReadableStream<Uint8Array>`. For memory-constrained edge
 *   runtimes.
 */
export type PdfOutput = 'response' | 'bytes' | 'stream';

export interface PdfOptions extends RenderOptions {
  /** Output shape — default `'response'`. */
  as?: PdfOutput;
  /** Suggested filename in the `Content-Disposition` header (response shape only). */
  filename?: string;
  /** `'inline'` displays in the browser, `'attachment'` triggers download. Default `'inline'`. */
  disposition?: 'inline' | 'attachment';
}

function buildResponse(
  bytes: Uint8Array,
  filename: string,
  disposition: 'inline' | 'attachment',
): Response {
  const safe = filename.replace(/[^\w.-]/g, '_');
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${safe}"`,
      'Content-Length': String(bytes.byteLength),
    },
  });
}

/**
 * Render a React element to a PDF. Picks output shape via `options.as`,
 * auto-loads `imprint.config.ts` from `process.cwd()`, and merges
 * caller-supplied options on top.
 *
 * @example
 * ```ts
 * // Next.js route handler — Response output by default:
 * export const GET = () => pdf(<Invoice />);
 *
 * // Escape hatches:
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
  const {
    as = 'response',
    filename = 'document.pdf',
    disposition = 'inline',
    ...renderOptions
  } = options;
  const resolved = await mergeWithConfig(renderOptions);

  if (as === 'bytes') return renderToBuffer(element, resolved);
  if (as === 'stream') return renderToStream(element, resolved);

  const bytes = await renderToBuffer(element, resolved);
  return buildResponse(bytes, filename, disposition);
}
