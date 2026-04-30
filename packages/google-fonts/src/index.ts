import type { FontDeclaration } from '@imprint/core';

// Use a minimal UA so Google Fonts returns TTF files, which @pdf-lib/fontkit can embed.
// Modern Chrome UAs trigger woff2 (brotli-compressed), which fontkit doesn't support.
const TTF_UA = 'Mozilla/5.0';

export interface GoogleFontOptions {
  /** Font weights to load. Defaults to [400]. */
  weights?: number[];
  /** Font styles to load. Defaults to ['normal']. */
  styles?: ('normal' | 'italic')[];
  /** font-display value. Defaults to 'swap'. */
  display?: string;
  /** Custom fetch implementation. Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
}

/**
 * Fetch font declarations from Google Fonts for one or more font families.
 *
 * Returns an array of {@link FontDeclaration} objects ready to pass to
 * `renderToBuffer({ fonts: ... })`. Each declaration holds a woff2 URL that
 * the asset resolver downloads when the PDF is rendered.
 *
 * @example
 * ```ts
 * const fonts = await googleFont('Outfit', { weights: [400, 700] });
 * await renderToBuffer(<Invoice />, { fonts, tailwind: {} });
 * ```
 */
export async function googleFont(
  family: string | string[],
  options: GoogleFontOptions = {},
): Promise<FontDeclaration[]> {
  const families = Array.isArray(family) ? family : [family];
  const weights = options.weights ?? [400];
  const styles = options.styles ?? ['normal'];
  const display = options.display ?? 'swap';
  const fetchFn = options.fetch ?? globalThis.fetch;

  if (!fetchFn) {
    throw new Error(
      '[imprint/google-fonts] No fetch implementation available. ' +
        'Pass one via options.fetch or upgrade to Node.js 18+.',
    );
  }

  const params = families.map((f) => buildFamilyParam(f, weights, styles)).join('&');
  const url = `https://fonts.googleapis.com/css2?${params}&display=${display}`;

  const res = await fetchFn(url, {
    headers: { 'User-Agent': TTF_UA },
  });

  if (!res.ok) {
    throw new Error(
      `[imprint/google-fonts] Google Fonts API returned ${res.status} ${res.statusText} for: ${url}`,
    );
  }

  const css = await res.text();
  return parseFontFaces(css);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildFamilyParam(
  family: string,
  weights: number[],
  styles: ('normal' | 'italic')[],
): string {
  const enc = encodeURIComponent(family);
  const hasItalic = styles.includes('italic');

  if (!hasItalic) {
    return `family=${enc}:wght@${weights.join(';')}`;
  }

  // Mixed: need ital,wght axis — each variant is "italVal,weight"
  const variants: string[] = [];
  for (const s of styles) {
    const ital = s === 'italic' ? 1 : 0;
    for (const w of weights) variants.push(`${ital},${w}`);
  }
  variants.sort();
  return `family=${enc}:ital,wght@${variants.join(';')}`;
}

/**
 * Parse @font-face blocks from a Google Fonts CSS response.
 * Google Fonts returns multiple blocks per variant (one per unicode-range subset).
 * We keep only the LAST occurrence per (family, weight, style) because Google
 * always puts the `latin` subset last, which is what we need for PDF generation.
 */
function parseFontFaces(css: string): FontDeclaration[] {
  const last = new Map<string, FontDeclaration>();

  const re = /@font-face\s*\{([^}]+)\}/g;
  let m = re.exec(css);
  while (m !== null) {
    const decl = parseFontFaceBlock(m[1]!);
    if (decl) {
      last.set(`${decl.family}:${decl.weight ?? 400}:${decl.style ?? 'normal'}`, decl);
    }
    m = re.exec(css);
  }

  return [...last.values()];
}

function parseFontFaceBlock(block: string): FontDeclaration | null {
  const prop = (name: string): string | undefined => {
    const r = new RegExp(`${name}\\s*:\\s*([^;]+)`, 'i');
    return r.exec(block)?.[1]?.trim();
  };

  const family = prop('font-family')?.replace(/^['"]|['"]$/g, '');
  if (!family) return null;

  const weightStr = prop('font-weight');
  const weight = weightStr ? parseInt(weightStr, 10) : 400;
  if (Number.isNaN(weight)) return null;

  const styleStr = prop('font-style');
  const style: 'normal' | 'italic' = styleStr === 'italic' ? 'italic' : 'normal';

  const srcStr = prop('src');
  if (!srcStr) return null;

  // Extract the first url(...) from the src value
  const urlMatch = /url\((['"]?)([^)'"]+)\1\)/.exec(srcStr);
  if (!urlMatch) return null;
  const src = urlMatch[2]!;

  // Extract format hint if present
  const fmtMatch = /format\(['"]([^'"]+)['"]\)/.exec(srcStr);
  const format = fmtMatch?.[1] as FontDeclaration['format'] | undefined;

  return { family, src, weight, style, ...(format ? { format } : {}) };
}
