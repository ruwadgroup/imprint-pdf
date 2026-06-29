import { PDFDocument, type PDFFont, StandardFonts } from 'pdf-lib';
import type { FontDeclaration } from '../types.js';

export interface HbFont {
  upem: number;
  shapeAdvance(
    text: string,
    sizePt: number,
    options?: { variations?: Record<string, number>; language?: string; vertical?: boolean },
  ): number;
}

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

export const DEFAULT_METRICS: FontMetrics = {
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

export function normalizeFamily(family: string): string {
  const lower = family.split(',')[0]?.trim().toLowerCase() ?? family.toLowerCase();
  return FAMILY_ALIAS[lower] ?? family;
}

export function fontKey(family: string, weight: number, style: 'normal' | 'italic'): string {
  return `${family}:${weight}:${style}`;
}

export function declWeight(weight: FontDeclaration['weight']): number {
  if (typeof weight === 'number') return weight;
  if (weight === undefined) return 400;
  return parseInt(String(weight), 10);
}

// Fontkit chokes on some .woff2 with RangeError; retry once with TTF/OTF.
// Fontsource and most CDNs ship both side-by-side, so swapping the format slot
// usually just works. Returns null if there's no plausible fallback.
export function ttfFallbackUrl(src: string): string | null {
  if (src.startsWith('fontsource:') || src.startsWith('fontsource-variable:')) {
    // Format slot is the 5th `:`-separated field — swap woff2 → ttf.
    if (/[:](woff2|woff)$/i.test(src)) return src.replace(/[:](woff2|woff)$/i, ':ttf');
    return `${src}:ttf`;
  }
  if (/\.woff2(\?|$)/i.test(src)) return src.replace(/\.woff2/i, '.ttf');
  return null;
}

// The four variants every standard PDF family ships.
const STANDARD_VARIANTS: ReadonlyArray<{ weight: number; style: 'normal' | 'italic' }> = [
  { weight: 400, style: 'normal' },
  { weight: 700, style: 'normal' },
  { weight: 400, style: 'italic' },
  { weight: 700, style: 'italic' },
];

// Embed all 12 standard variants (Helvetica/Times/Courier x 4) into `doc`,
// keyed by canonical family. Both the layout (measure) pass and the writer
// (draw) pass embed this same set so `font-serif`/`font-mono` resolve to real
// Times/Courier - not a silent Helvetica fallback - and, critically, so the
// two passes compute identical glyph advances. A width mismatch between measure
// and draw makes a shrink-to-content box too narrow for the text the writer
// then lays out, which wraps an extra line and overlaps whatever follows.
export async function embedStandardFontSet(doc: PDFDocument): Promise<Map<string, LoadedFont>> {
  const fonts = new Map<string, LoadedFont>();
  for (const [family, variants] of Object.entries(STANDARD_FONT_MAP)) {
    for (const { weight, style } of STANDARD_VARIANTS) {
      const standardFont = variants[`${weight}-${style}`];
      if (!standardFont) continue;
      const pdfFont = await doc.embedFont(standardFont);
      fonts.set(fontKey(family, weight, style), {
        family,
        weight,
        style,
        pdfFont,
        metrics: DEFAULT_METRICS,
      });
    }
  }
  return fonts;
}

// Standard-font AFM widths are document-independent, so the layout pass can
// reuse one cached set embedded in a throwaway document instead of re-embedding
// every render. (The writer must still embed into its own output document.)
let standardMetricsCache: Promise<Map<string, LoadedFont>> | undefined;
export function getStandardFontMetrics(): Promise<Map<string, LoadedFont>> {
  if (!standardMetricsCache) {
    standardMetricsCache = PDFDocument.create().then(embedStandardFontSet);
  }
  return standardMetricsCache;
}

// Resolves `(family, weight, style)` to a loaded font. Fallback chain:
// closest weight in the same family -> family alias (Arial -> Helvetica) ->
// Helvetica 400 normal.
export function selectFont(
  fonts: Map<string, LoadedFont>,
  family: string,
  weight: number,
  style: 'normal' | 'italic',
): LoadedFont | undefined {
  const exact = fonts.get(fontKey(family, weight, style));
  if (exact) return exact;

  // Style mismatch costs 100, which exceeds the max weight gap (800), so
  // a matching-style font always beats a wrong-style one.
  let best: LoadedFont | undefined;
  let bestDiff = Infinity;
  for (const f of fonts.values()) {
    if (f.family !== family) continue;
    const diff = Math.abs(f.weight - weight) + (f.style !== style ? 100 : 0);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = f;
    }
  }
  if (best) return best;

  const canonical = normalizeFamily(family);
  if (canonical !== family) {
    return selectFont(fonts, canonical, weight, style);
  }

  return fonts.get(fontKey('Helvetica', 400, 'normal'));
}
