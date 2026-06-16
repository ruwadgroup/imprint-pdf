import type { FontDeclaration } from '@imprint-pdf/core';
import { buildFamilyParam, parseFontFaces } from '../css.js';
import type { FontProvider, LoadFontOptions } from '../types.js';

// Modern Chrome UAs trigger woff2 (brotli-compressed); @pdf-lib/fontkit
// can't embed woff2, so we ask Google for TTF by sending a plain UA.
const TTF_UA = 'Mozilla/5.0';

export interface GoogleProviderOptions {
  baseUrl?: string;
}

export function googleProvider(opts: GoogleProviderOptions = {}): FontProvider {
  const baseUrl = opts.baseUrl ?? 'https://fonts.googleapis.com/css2';

  return {
    name: 'google',
    async load(family, options: LoadFontOptions = {}): Promise<FontDeclaration[]> {
      const families = Array.isArray(family) ? family : [family];
      const weights = options.weights ?? [400];
      const styles = options.styles ?? ['normal'];
      const display = options.display ?? 'swap';
      const fetchFn = options.fetch ?? globalThis.fetch;

      if (!fetchFn) {
        throw new Error(
          '[imprint/font] No fetch implementation available. Pass options.fetch or upgrade to Node.js 18+.',
        );
      }

      const params = families
        .map((f) => buildFamilyParam(f, weights, styles, options.axes))
        .join('&');
      const url = `${baseUrl}?${params}&display=${display}`;
      const res = await fetchFn(url, { headers: { 'User-Agent': TTF_UA } });
      if (!res.ok) {
        throw new Error(
          `[imprint/font] Google Fonts returned ${res.status} ${res.statusText} for: ${url}`,
        );
      }
      return parseFontFaces(await res.text());
    },
  };
}
