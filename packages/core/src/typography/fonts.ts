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

async function loadCustomFont(
  doc: PDFDocument,
  decl: FontDeclaration,
  resolver: AssetResolver,
): Promise<LoadedFont | undefined> {
  try {
    const bytes = await resolver.resolve(decl.src);
    const pdfFont = await doc.embedFont(bytes, { subset: true });

    const weight =
      typeof decl.weight === 'number'
        ? decl.weight
        : decl.weight !== undefined
          ? parseInt(String(decl.weight), 10)
          : 400;
    const style: 'normal' | 'italic' = decl.style ?? 'normal';

    // Reach into pdf-lib's embedder to grab the underlying fontkit font.
    // pdf-lib doesn't expose font metrics on its public surface, but we need
    // them for line-height resolution. Two property names because the field
    // moved between minor versions; defaults catch any future rename.
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
    } catch {
      // Default metrics are accurate enough for layout when embedder shape
      // changes; the visible result is slightly looser leading.
    }

    return {
      family: decl.family,
      weight,
      style,
      pdfFont,
      metrics,
      rawBytes: bytes,
    };
  } catch (err) {
    console.warn(`[imprint] Failed to load font "${decl.family}" from ${decl.src}:`, err);
    return undefined;
  }
}

async function loadStandardFont(
  doc: PDFDocument,
  family: string,
  weight: number,
  style: 'normal' | 'italic',
): Promise<LoadedFont> {
  const canonicalFamily = normalizeFamily(family);
  const fontVariants = STANDARD_FONT_MAP[canonicalFamily] ?? STANDARD_FONT_MAP.Helvetica!;

  // PDF standard fonts ship with only four variants per family. Map any
  // requested (weight, style) onto the closest available one rather than
  // refusing to render: exact → same-style 700 if heavy / 400 if light → plain.
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
 * Pre-pass loader that builds HarfBuzz shapers without embedding into a PDF.
 * Layout measurement runs before we have a PDFDocument, and embedding is the
 * expensive step (subsetting, CFF parsing, …). Splitting out the shaping-only
 * path lets the layout phase use real glyph advances at a fraction of the
 * cost of full embedding.
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
    } catch {
      // Layout falls back to charWidth heuristics if shaping is unavailable.
    }
  }
  return fonts;
}

export async function loadFonts(
  doc: PDFDocument,
  declarations: FontDeclaration[],
  resolver: AssetResolver,
): Promise<Map<string, LoadedFont>> {
  // pdf-lib only embeds StandardFonts out of the box; fontkit is required for
  // anything else. Skip the registration when no custom fonts are declared so
  // documents that only use Helvetica don't pull in fontkit's parser.
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

  // selectFont's last-resort fallback is Helvetica at 400 normal — make sure
  // it's actually loaded so a missing font never ends in undefined.
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
 * Resolves (family, weight, style) to a loaded font, walking a chain of
 * progressively looser matches:
 *
 *   1. Exact (family, weight, style) hit.
 *   2. Same family, closest weight + matching style preferred — `bestDiff`
 *      penalizes a style mismatch by 100, which exceeds the largest legal
 *      weight gap (900 - 100 = 800), so any weight in the matching style
 *      beats every weight in the wrong style.
 *   3. Resolve the family through aliases (`Arial` → `Helvetica`, etc.) and
 *      retry against the alias.
 *   4. Helvetica 400 normal — guaranteed present by loadFonts.
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
