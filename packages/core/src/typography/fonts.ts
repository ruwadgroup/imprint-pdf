import fontkitLib from '@pdf-lib/fontkit';
import { type PDFDocument, type PDFFont, StandardFonts } from 'pdf-lib';
import type { AssetResolver, FontDeclaration } from '../types.js';
import { createHbFont, type HbFont } from './shaper.js';

export interface FontMetrics {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
}

export interface LoadedFont {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  pdfFont?: PDFFont;
  metrics: FontMetrics;
  rawBytes?: Uint8Array;
  hbFont?: HbFont;
}

const DEFAULT_METRICS: FontMetrics = {
  unitsPerEm: 1000,
  ascent: 800,
  descent: -200,
  lineGap: 0,
};

const STANDARD_FONT_MAP: Record<string, Record<string, StandardFonts>> = {
  Helvetica: {
    '400-normal': StandardFonts.Helvetica,
    '700-normal': StandardFonts.HelveticaBold,
    '400-italic': StandardFonts.HelveticaOblique,
    '700-italic': StandardFonts.HelveticaBoldOblique,
  },
  'Times-Roman': {
    '400-normal': StandardFonts.TimesRoman,
    '700-normal': StandardFonts.TimesRomanBold,
    '400-italic': StandardFonts.TimesRomanItalic,
    '700-italic': StandardFonts.TimesRomanBoldItalic,
  },
  Courier: {
    '400-normal': StandardFonts.Courier,
    '700-normal': StandardFonts.CourierBold,
    '400-italic': StandardFonts.CourierOblique,
    '700-italic': StandardFonts.CourierBoldOblique,
  },
};

const FAMILY_ALIAS: Record<string, string> = {
  helvetica: 'Helvetica',
  arial: 'Helvetica',
  'sans-serif': 'Helvetica',
  'ui-sans-serif': 'Helvetica',
  'system-ui': 'Helvetica',
  times: 'Times-Roman',
  'times new roman': 'Times-Roman',
  'times-roman': 'Times-Roman',
  serif: 'Times-Roman',
  'ui-serif': 'Times-Roman',
  georgia: 'Times-Roman',
  courier: 'Courier',
  'courier new': 'Courier',
  monospace: 'Courier',
  'ui-monospace': 'Courier',
};

function normalizeFamily(family: string): string {
  const lower = family.split(',')[0]?.trim().toLowerCase() ?? family.toLowerCase();
  return FAMILY_ALIAS[lower] ?? family;
}

function fontKey(family: string, weight: number, style: 'normal' | 'italic'): string {
  return `${family}:${weight}:${style}`;
}

// WOFF2 → TTF / OTF: if fontkit throws RangeError on a .woff2, retry once
// with a TTF/OTF variant of the same file. Many Fontsource and CDN-hosted
// fonts ship both formats side-by-side; for `fontsource:` URLs we just swap
// the format slot. Returns null if no plausible fallback URL exists.
function ttfFallbackUrl(src: string): string | null {
  if (src.startsWith('fontsource:') || src.startsWith('fontsource-variable:')) {
    // The format slot is the 5th `:`-separated field; swap woff2 → ttf.
    // If the URL has fewer fields, append the format with the standard defaults.
    if (/[:](woff2|woff)$/i.test(src)) return src.replace(/[:](woff2|woff)$/i, ':ttf');
    return `${src}:ttf`;
  }
  if (/\.woff2(\?|$)/i.test(src)) return src.replace(/\.woff2/i, '.ttf');
  return null;
}

async function tryLoadFontBytes(
  doc: PDFDocument,
  resolver: AssetResolver,
  src: string,
): Promise<{ bytes: Uint8Array; pdfFont: import('pdf-lib').PDFFont } | undefined> {
  const bytes = await resolver.resolve(src);
  const pdfFont = await doc.embedFont(bytes, { subset: true });
  return { bytes, pdfFont };
}

async function loadCustomFont(
  doc: PDFDocument,
  decl: FontDeclaration,
  resolver: AssetResolver,
): Promise<LoadedFont | undefined> {
  let loaded: { bytes: Uint8Array; pdfFont: import('pdf-lib').PDFFont } | undefined;
  try {
    loaded = await tryLoadFontBytes(doc, resolver, decl.src);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isFontkitRangeError = /Index out of range/i.test(msg);
    const fallback = isFontkitRangeError ? ttfFallbackUrl(decl.src) : null;

    if (fallback) {
      console.warn(
        `[imprint] WOFF2 decoder rejected "${decl.family}" (${decl.src}); ` +
          `retrying with ${fallback}.`,
      );
      try {
        loaded = await tryLoadFontBytes(doc, resolver, fallback);
      } catch (fallbackErr) {
        console.warn(
          `[imprint] Fallback to ${fallback} also failed for "${decl.family}":`,
          fallbackErr,
        );
        return undefined;
      }
    } else {
      console.warn(`[imprint] Failed to load font "${decl.family}" from ${decl.src}:`, err);
      return undefined;
    }
  }

  if (!loaded) return undefined;
  const { bytes, pdfFont } = loaded;

  const weight =
    typeof decl.weight === 'number'
      ? decl.weight
      : decl.weight !== undefined
        ? parseInt(String(decl.weight), 10)
        : 400;
  const style: 'normal' | 'italic' = decl.style ?? 'normal';

  // pdf-lib doesn't expose metrics; reach into the embedder for them. The
  // field renamed across minor versions, hence both lookups.
  let metrics: FontMetrics = DEFAULT_METRICS;
  try {
    // @ts-expect-error — internal fontkit reference
    const fk = pdfFont.embedder?.font ?? pdfFont.embedder?.customFont;
    if (fk) {
      metrics = {
        unitsPerEm: fk.unitsPerEm ?? 1000,
        ascent: fk.ascent ?? 800,
        descent: fk.descent ?? -200,
        lineGap: fk.lineGap ?? 0,
      };
    }
  } catch {}

  return {
    family: decl.family,
    weight,
    style,
    pdfFont,
    metrics,
    rawBytes: bytes,
  };
}

async function loadStandardFont(
  doc: PDFDocument,
  family: string,
  weight: number,
  style: 'normal' | 'italic',
): Promise<LoadedFont> {
  const canonicalFamily = normalizeFamily(family);
  const fontVariants = STANDARD_FONT_MAP[canonicalFamily] ?? STANDARD_FONT_MAP.Helvetica!;

  // Standard PDF fonts ship with only four variants per family; map any
  // (weight, style) onto the closest available one.
  const exactKey = `${weight}-${style}`;
  const boldKey = `700-${style}`;
  const normalKey = `400-${style}`;
  const plainKey = '400-normal';

  const standardFont =
    fontVariants[exactKey] ??
    (weight >= 600 ? fontVariants[boldKey] : fontVariants[normalKey]) ??
    fontVariants[plainKey] ??
    StandardFonts.Helvetica;

  const pdfFont = await doc.embedFont(standardFont);

  return {
    family,
    weight,
    style,
    pdfFont,
    metrics: DEFAULT_METRICS,
  };
}

/**
 * Builds HarfBuzz shapers without embedding into a PDF — the layout phase
 * needs glyph advances before a `PDFDocument` exists, and embedding (subsetting,
 * CFF parsing) is the expensive step.
 */
export async function loadFontMetricsOnly(
  declarations: FontDeclaration[],
  resolver: AssetResolver,
): Promise<Map<string, LoadedFont>> {
  const fonts = new Map<string, LoadedFont>();
  for (const decl of declarations) {
    try {
      const bytes = await resolver.resolve(decl.src);
      const weight =
        typeof decl.weight === 'number'
          ? decl.weight
          : decl.weight !== undefined
            ? parseInt(String(decl.weight), 10)
            : 400;
      const style: 'normal' | 'italic' = decl.style ?? 'normal';
      fonts.set(fontKey(decl.family, weight, style), {
        family: decl.family,
        weight,
        style,
        metrics: DEFAULT_METRICS,
        hbFont: createHbFont(bytes),
      });
    } catch {}
  }
  return fonts;
}

export async function loadFonts(
  doc: PDFDocument,
  declarations: FontDeclaration[],
  resolver: AssetResolver,
): Promise<Map<string, LoadedFont>> {
  // fontkit is only needed for non-StandardFonts; skip registering it when
  // every font in the doc is Helvetica/Times/Courier.
  if (declarations.length > 0) {
    doc.registerFontkit(fontkitLib);
  }

  const fonts = new Map<string, LoadedFont>();

  for (const decl of declarations) {
    const loaded = await loadCustomFont(doc, decl, resolver);
    if (loaded) {
      const weight =
        typeof decl.weight === 'number'
          ? decl.weight
          : decl.weight !== undefined
            ? parseInt(String(decl.weight), 10)
            : 400;
      const style: 'normal' | 'italic' = decl.style ?? 'normal';
      fonts.set(fontKey(decl.family, weight, style), loaded);
    }
  }

  // selectFont's last-resort fallback. Guarantee it's present so a missing
  // family never returns undefined.
  const fallbackKey = fontKey('Helvetica', 400, 'normal');
  if (!fonts.has(fallbackKey)) {
    const fallback = await loadStandardFont(doc, 'Helvetica', 400, 'normal');
    fonts.set(fallbackKey, fallback);
  }

  for (const f of fonts.values()) {
    if (f.rawBytes !== undefined) f.hbFont = createHbFont(f.rawBytes);
  }

  return fonts;
}

/**
 * Resolves `(family, weight, style)` to a loaded font, falling back to the
 * closest weight in the same family, then a family alias (e.g. `Arial` →
 * `Helvetica`), then Helvetica 400 normal.
 */
export function selectFont(
  fonts: Map<string, LoadedFont>,
  family: string,
  weight: number,
  style: 'normal' | 'italic',
): LoadedFont | undefined {
  const exact = fonts.get(fontKey(family, weight, style));
  if (exact) return exact;

  const families = [...fonts.values()].filter((f) => f.family === family);
  if (families.length > 0) {
    let best: LoadedFont | undefined;
    let bestDiff = Infinity;
    // Style-mismatch penalty (100) exceeds the maximum weight gap (900-100),
    // so any matching-style font beats any wrong-style font.
    for (const f of families) {
      const diff = Math.abs(f.weight - weight) + (f.style !== style ? 100 : 0);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = f;
      }
    }
    if (best) return best;
  }

  const canonical = normalizeFamily(family);
  if (canonical !== family) {
    return selectFont(fonts, canonical, weight, style);
  }

  return fonts.get(fontKey('Helvetica', 400, 'normal'));
}
