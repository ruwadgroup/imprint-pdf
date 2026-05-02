import type { RenderOptions } from '@imprint-pdf/core';
import type { ReactElement } from 'react';

export async function renderToServer(
  element: ReactElement,
  options?: RenderOptions,
): Promise<Uint8Array> {
  // dynamic import keeps @imprint-pdf/react out of the client bundle
  const { renderToBuffer } = await import('@imprint-pdf/react');
  return renderToBuffer(element, options);
}

export interface EdgeRenderOptions extends RenderOptions {
  /** pre-compiled WebAssembly module for the PDF renderer (optional) */
  wasm?: WebAssembly.Module;
}

export async function renderToEdge(
  element: ReactElement,
  options?: EdgeRenderOptions,
): Promise<ReadableStream<Uint8Array>> {
  // @imprint-pdf/react/standalone is a self-contained build for v8 isolate environments
  const { renderToStream } = await import('@imprint-pdf/react/standalone');
  return renderToStream(element, options);
}

export interface ImprintConfig {
  fonts?: Array<{
    family: string;
    src: string;
    weight?: number;
    style?: 'normal' | 'italic';
  }>;
  tailwind?: {
    config?: string;
    stylesheet?: string;
  };
  [key: string]: unknown;
}

export async function getImprintConfig(): Promise<ImprintConfig> {
  const configPaths = [
    './imprint.config.ts',
    './imprint.config.js',
    './imprint.config.mjs',
    './imprint.config.cjs',
  ];

  for (const configPath of configPaths) {
    try {
      const mod = await import(/* @vite-ignore */ configPath);
      const config: unknown = mod.default ?? mod;
      if (config && typeof config === 'object') {
        return config as ImprintConfig;
      }
    } catch {
      // config file not present — try the next candidate
    }
  }

  return {};
}

export interface PdfResponseOptions extends RenderOptions {
  /** suggested filename for Content-Disposition header */
  filename?: string;
  /** 'inline' displays in the browser, 'attachment' triggers download */
  disposition?: 'inline' | 'attachment';
}

export async function createPdfResponse(
  element: ReactElement,
  options: PdfResponseOptions = {},
): Promise<Response> {
  const { filename = 'document.pdf', disposition = 'inline', ...renderOptions } = options;
  const bytes = await renderToServer(element, renderOptions);

  const safeFilename = filename.replace(/[^\w.-]/g, '_');

  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${safeFilename}"`,
      'Content-Length': String(bytes.byteLength),
    },
  });
}

export type { RenderOptions } from '@imprint-pdf/core';
