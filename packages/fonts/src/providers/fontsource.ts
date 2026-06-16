import type { FontDeclaration } from '@imprint-pdf/core';
import type { FontProvider, LoadFontOptions } from '../types.js';

export interface FontsourceProviderOptions {
  baseUrl?: string;
}

function slug(family: string): string {
  return family.toLowerCase().replace(/\s+/g, '-');
}

// Fontsource serves TTFs at predictable paths, so we synthesize URLs
// directly instead of fetching their CSS index.
// See https://fontsource.org/docs/getting-started/install.
export function fontsourceProvider(opts: FontsourceProviderOptions = {}): FontProvider {
  const baseUrl = opts.baseUrl ?? 'https://cdn.jsdelivr.net/fontsource/fonts';

  return {
    name: 'fontsource',
    async load(family, options: LoadFontOptions = {}): Promise<FontDeclaration[]> {
      const families = Array.isArray(family) ? family : [family];
      const weights = options.weights ?? [400];
      const styles = options.styles ?? ['normal'];

      const decls: FontDeclaration[] = [];
      for (const f of families) {
        for (const w of weights) {
          for (const s of styles) {
            const styleSeg = s === 'italic' ? 'italic' : 'normal';
            decls.push({
              family: f,
              src: `${baseUrl}/${slug(f)}@latest/latin-${w}-${styleSeg}.ttf`,
              weight: w,
              style: s,
              format: 'ttf',
            });
          }
        }
      }
      return decls;
    },
  };
}
