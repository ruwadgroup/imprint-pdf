import type { FontDeclaration } from '@imprint-pdf/core';

/**
 * Google Fonts via Fontsource — the next/font experience for imprint-pdf.
 *
 * ```ts
 * // imprint.config.ts
 * import { defineConfig } from '@imprint-pdf/core/config';
 * import { googleFont } from '@imprint-pdf/fonts/google';
 *
 * export default defineConfig({
 *   fonts: [
 *     ...googleFont('Inter', { weight: ['400', '500', '600', '700'] }),
 *     ...googleFont('JetBrains Mono'),
 *     ...googleFont('Outfit', { variable: true, axes: { wght: [100, 900] } }),
 *   ],
 * });
 * ```
 *
 * Resolves to the Fontsource jsdelivr CDN at render time via the
 * `fontsource:` URL scheme. No build-time downloading, no manual URL hunting,
 * no per-weight repetition.
 */
export interface GoogleFontOptions {
  /**
   * One or more numeric weights, as strings. Defaults to `['400']`.
   * Ignored when `variable: true` (the variable file covers the whole range).
   */
  weight?: GoogleFontWeight | GoogleFontWeight[];
  /** `'normal'`, `'italic'`, or both. Defaults to `['normal']`. */
  style?: GoogleFontStyle | GoogleFontStyle[];
  /** Use the variable-font release. Requires `axes` to specify the ranges. */
  variable?: boolean;
  /**
   * Axis ranges for variable fonts. Only meaningful when `variable: true`.
   * Example: `{ wght: [100, 900] }`.
   */
  axes?: Record<string, [number, number]>;
  /** Fontsource subset slug — defaults to `'latin'`. */
  subset?: string;
  /** Pinned Fontsource major version — defaults to `'5'`. */
  version?: string;
}

export type GoogleFontWeight =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

export type GoogleFontStyle = 'normal' | 'italic';

const DEFAULT_WEIGHTS: GoogleFontWeight[] = ['400'];
const DEFAULT_STYLES: GoogleFontStyle[] = ['normal'];

function toArray<T>(value: T | T[] | undefined, fallback: T[]): T[] {
  if (value === undefined) return fallback;
  return Array.isArray(value) ? value : [value];
}

// Google Fonts family names → Fontsource slugs are just kebab-case lowercase.
// `Inter` → `inter`, `JetBrains Mono` → `jetbrains-mono`,
// `IBM Plex Sans` → `ibm-plex-sans`.
function familyToSlug(family: string): string {
  return family
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Return one or more `FontDeclaration` entries for a Google Fonts family.
 * Spread into `imprint.config.ts`'s `fonts` array.
 */
export function googleFont(family: string, options: GoogleFontOptions = {}): FontDeclaration[] {
  const slug = familyToSlug(family);
  if (!slug) {
    throw new Error(
      `googleFont: family name resolves to an empty slug — got ${JSON.stringify(family)}`,
    );
  }
  const version = options.version ?? '5';
  const subset = options.subset ?? 'latin';

  if (options.variable) {
    const styles = toArray(options.style, DEFAULT_STYLES);
    return styles.map((style) => {
      const decl: FontDeclaration = {
        family,
        // axis is always `wght` for now; Fontsource doesn't expose other axes
        // as separate files in the typical case.
        src: `fontsource-variable:${slug}@${version}:wght:${style}:${subset}:woff2`,
        style,
        variable: true,
      };
      if (options.axes) decl.axes = options.axes;
      return decl;
    });
  }

  const weights = toArray(options.weight, DEFAULT_WEIGHTS);
  const styles = toArray(options.style, DEFAULT_STYLES);

  const out: FontDeclaration[] = [];
  for (const weight of weights) {
    for (const style of styles) {
      out.push({
        family,
        src: `fontsource:${slug}@${version}:${weight}:${style}:${subset}:woff2`,
        weight: Number(weight),
        style,
      });
    }
  }
  return out;
}
