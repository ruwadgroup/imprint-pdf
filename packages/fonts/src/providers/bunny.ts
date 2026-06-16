import type { FontDeclaration } from '@imprint-pdf/core';
import { buildFamilyParam, parseFontFaces } from '../css.js';
import type { FontProvider, LoadFontOptions } from '../types.js';

export interface BunnyProviderOptions {
  baseUrl?: string;
}

// Bunny Fonts is a Google-Fonts-compatible privacy-respecting mirror —
// same `css2?family=` API but no UA-dependent format negotiation.
export function bunnyProvider(opts: BunnyProviderOptions = {}): FontProvider {
  const baseUrl = opts.baseUrl ?? 'https://fonts.bunny.net/css';

  return {
    name: 'bunny',
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
      const res = await fetchFn(url);
      if (!res.ok) {
        throw new Error(
          `[imprint/font] Bunny Fonts returned ${res.status} ${res.statusText} for: ${url}`,
        );
      }
      return parseFontFaces(await res.text());
    },
  };
}
