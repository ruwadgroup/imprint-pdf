// ---------------------------------------------------------------------------
// @imprint/vite — Vite plugin
//
// Composes the Tailwind extraction plugin, a virtual font module plugin, and
// an HMR plugin that triggers full page reload when a .pdf.tsx file changes.
// ---------------------------------------------------------------------------

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { ImprintTailwindOptions } from '@imprint/tailwind';
import { imprintTailwind } from '@imprint/tailwind/vite';
import type { Plugin } from 'vite';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FontDefinition {
  /** CSS font-family name */
  family: string;
  /** File path or URL to the font file (ttf, otf, woff, woff2) */
  src: string;
  /** Numeric font weight, e.g. 400, 700 */
  weight?: number;
  /** Font style */
  style?: 'normal' | 'italic';
}

export interface ImprintViteOptions extends ImprintTailwindOptions {
  fonts?: FontDefinition[];
}

// ---------------------------------------------------------------------------
// imprintFonts plugin
// ---------------------------------------------------------------------------

/**
 * Virtual module plugin for fonts.
 *
 * Usage in consuming code:
 *   import fontData from 'virtual:imprint-font/Inter'
 *   // fontData is a base64 data URL string
 */
function imprintFonts(options: ImprintViteOptions): Plugin {
  return {
    name: 'imprint-fonts',
    enforce: 'pre',

    resolveId(id) {
      if (id.startsWith('virtual:imprint-font/')) {
        return `\0${id}`;
      }
      return null;
    },

    async load(id) {
      if (!id.startsWith('\0virtual:imprint-font/')) return null;

      const family = id.replace('\0virtual:imprint-font/', '');
      const font = options.fonts?.find((f) => f.family === family);
      if (!font) {
        this.warn(`[imprint-fonts] No font registered for family "${family}"`);
        return `export default null`;
      }

      // If src looks like an absolute file path or relative file path, embed it
      const src = font.src;
      if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
        if (existsSync(src)) {
          try {
            const buf = await readFile(src);
            const b64 = buf.toString('base64');
            const ext = src.split('.').pop()?.toLowerCase() ?? 'ttf';
            const mime =
              ext === 'woff2'
                ? 'font/woff2'
                : ext === 'woff'
                  ? 'font/woff'
                  : ext === 'otf'
                    ? 'font/otf'
                    : 'font/ttf';
            const dataUrl = `data:${mime};base64,${b64}`;
            return `export default ${JSON.stringify(dataUrl)}`;
          } catch (err) {
            this.warn(`[imprint-fonts] Failed to read font file "${src}": ${String(err)}`);
          }
        } else {
          this.warn(`[imprint-fonts] Font file not found: "${src}"`);
        }
      }

      // Fallback: return src as-is (URL or data URI)
      return `export default ${JSON.stringify(src)}`;
    },

    // Expose a virtual module that lists all registered fonts with metadata
    // import { fonts } from 'virtual:imprint-fonts'
    // Returns: Array<FontDefinition>
  };
}

// ---------------------------------------------------------------------------
// imprintFontsList plugin — virtual:imprint-fonts → font metadata list
// ---------------------------------------------------------------------------

function imprintFontsList(options: ImprintViteOptions): Plugin {
  const VIRTUAL_ID = 'virtual:imprint-fonts';
  const RESOLVED_ID = `\0${VIRTUAL_ID}`;

  return {
    name: 'imprint-fonts-list',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      const fonts = options.fonts ?? [];
      return `export const fonts = ${JSON.stringify(fonts)}`;
    },
  };
}

// ---------------------------------------------------------------------------
// imprintHmr plugin
// ---------------------------------------------------------------------------

function imprintHmr(): Plugin {
  return {
    name: 'imprint-hmr',

    handleHotUpdate({ file, server }) {
      if (file.endsWith('.pdf.tsx') || file.endsWith('.pdf.ts')) {
        // Full reload so the PDF is re-rendered with the new component tree
        server.ws.send({ type: 'full-reload', path: '*' });
        // Return an empty array to tell Vite we've handled the update
        return [];
      }
      return undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// imprint — composite plugin factory
// ---------------------------------------------------------------------------

/**
 * Returns the full set of Vite plugins needed for Imprint PDF development:
 *
 * 1. `imprint-tailwind` — compile-time Tailwind class extraction
 * 2. `imprint-fonts`    — virtual font module (`virtual:imprint-font/<family>`)
 * 3. `imprint-fonts-list` — virtual module for font metadata list
 * 4. `imprint-hmr`      — full-reload HMR for `.pdf.tsx` files
 *
 * @example
 * // vite.config.ts
 * import { imprint } from '@imprint/vite'
 *
 * export default {
 *   plugins: [
 *     imprint({
 *       fonts: [{ family: 'Inter', src: './fonts/Inter.ttf' }],
 *       safelist: ['text-red-500'],
 *     }),
 *   ],
 * }
 */
export function imprint(options: ImprintViteOptions = {}): Plugin[] {
  return [imprintTailwind(options), imprintFonts(options), imprintFontsList(options), imprintHmr()];
}

export type { ImprintTailwindOptions } from '@imprint/tailwind';
// Named re-exports for consumers who want individual plugins
export { imprintTailwind } from '@imprint/tailwind/vite';
