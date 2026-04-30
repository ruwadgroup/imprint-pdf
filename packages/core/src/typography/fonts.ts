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

    // pdf-lib embeds fontkit; access metrics via internal reference
    let metrics: FontMetrics = DEFAULT_METRICS;
    try {
      // @ts-expect-error — accessing internal fontkit font
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
      // fall back to default metrics
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

  // try exact match, then weight fallback, then plain
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

// keys are `family:weight:style` strings
// Loads only HbFont metric objects (no PDF embedding) for use during layout measurement.
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
      // ignore — font will fall back to approximation during layout
    }
  }
  return fonts;
}

export async function loadFonts(
  doc: PDFDocument,
  declarations: FontDeclaration[],
  resolver: AssetResolver,
): Promise<Map<string, LoadedFont>> {
  // Register fontkit so pdf-lib can embed custom (non-standard) fonts
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

  // always ensure helvetica fallback is available
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

// falls back gracefully if an exact match is not found
export function selectFont(
  fonts: Map<string, LoadedFont>,
  family: string,
  weight: number,
  style: 'normal' | 'italic',
): LoadedFont | undefined {
  const exact = fonts.get(fontKey(family, weight, style));
  if (exact) return exact;

  // same family, find closest weight
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

  // try normalized family alias
  const canonical = normalizeFamily(family);
  if (canonical !== family) {
    return selectFont(fonts, canonical, weight, style);
  }

  return fonts.get(fontKey('Helvetica', 400, 'normal'));
}
