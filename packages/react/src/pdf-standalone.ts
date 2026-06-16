import type { ReactElement } from 'react';
import type { PdfOptions } from './pdf.js';
import { renderToBuffer, renderToStream } from './render-standalone.js';

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

  if (as === 'bytes') return renderToBuffer(element, renderOptions);
  if (as === 'stream') return renderToStream(element, renderOptions);

  const bytes = await renderToBuffer(element, renderOptions);
  return buildResponse(bytes, filename, disposition);
}
