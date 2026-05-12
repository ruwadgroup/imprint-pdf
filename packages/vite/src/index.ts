import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { ImprintTailwindOptions } from '@imprint-pdf/tailwind';
import { imprintTailwind } from '@imprint-pdf/tailwind/vite';
import type { Plugin } from 'vite';

export interface FontDefinition {
  family: string;
  /** File path or URL to the font file (ttf, otf, woff, woff2). */
  src: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

export interface ImprintViteOptions extends ImprintTailwindOptions {
  fonts?: FontDefinition[];
}

/**
 * `virtual:imprint-font/<family>` resolves to a base64 data URL (or the raw
 * URL/data URI when the src isn't a local file).
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
            return `export default ${JSON.stringify(`data:${mime};base64,${b64}`)}`;
          } catch (err) {
            this.warn(`[imprint-fonts] Failed to read font file "${src}": ${String(err)}`);
          }
        } else {
          this.warn(`[imprint-fonts] Font file not found: "${src}"`);
        }
      }

      return `export default ${JSON.stringify(src)}`;
    },
  };
}

/** `virtual:imprint-fonts` → `export const fonts: FontDefinition[]`. */
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

// Re-render `.pdf.tsx` files via a full page reload (component tree changes
// invalidate the entire PDF, not just one module).
function imprintHmr(): Plugin {
  return {
    name: 'imprint-hmr',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.pdf.tsx') || file.endsWith('.pdf.ts')) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
      return undefined;
    },
  };
}

/**
 * Returns the full set of Vite plugins needed for imprint-pdf: Tailwind class
 * extraction, virtual font modules, and full-reload HMR for `.pdf.tsx`.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { imprint } from '@imprint-pdf/vite'
 * export default {
 *   plugins: [imprint({ fonts: [{ family: 'Inter', src: './fonts/Inter.ttf' }] })],
 * }
 * ```
 */
export function imprint(options: ImprintViteOptions = {}): Plugin[] {
  return [imprintTailwind(options), imprintFonts(options), imprintFontsList(options), imprintHmr()];
}

export type { ImprintTailwindOptions } from '@imprint-pdf/tailwind';
export { imprintTailwind } from '@imprint-pdf/tailwind/vite';
