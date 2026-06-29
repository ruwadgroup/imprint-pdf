import fontkitLib from '@pdf-lib/fontkit';
import type { PDFDocument } from 'pdf-lib';
import type { AssetResolver, FontDeclaration, RenderOptions } from '../types.js';
import { reportAssetError } from '../writer/drawImage.js';
import {
  DEFAULT_METRICS,
  declWeight,
  type FontMetrics,
  fontKey,
  type LoadedFont,
  loadStandardFont,
  ttfFallbackUrl,
} from './font-common.js';

export type { FontMetrics, HbFont, LoadedFont } from './font-common.js';
export { selectFont } from './font-common.js';

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
  onAssetError?: RenderOptions['onAssetError'],
): Promise<LoadedFont | undefined> {
  let loaded: { bytes: Uint8Array; pdfFont: import('pdf-lib').PDFFont } | undefined;
  try {
    loaded = await tryLoadFontBytes(doc, resolver, decl.src);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isFontkitRangeError = /Index out of range/i.test(msg);
    const fallback = isFontkitRangeError ? ttfFallbackUrl(decl.src) : null;

    if (fallback) {
      try {
        loaded = await tryLoadFontBytes(doc, resolver, fallback);
      } catch (fallbackErr) {
        reportAssetError({ src: fallback, kind: 'font', error: fallbackErr }, onAssetError);
        return undefined;
      }
    } else {
      reportAssetError({ src: decl.src, kind: 'font', error: err }, onAssetError);
      return undefined;
    }
  }

  if (!loaded) return undefined;
  const { bytes, pdfFont } = loaded;
  const weight = declWeight(decl.weight);
  const style: 'normal' | 'italic' = decl.style ?? 'normal';

  let metrics: FontMetrics = DEFAULT_METRICS;
  try {
    // @ts-expect-error -- internal fontkit reference
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

export async function loadFontMetricsOnly(
  _declarations: FontDeclaration[],
  _resolver: AssetResolver,
  _onAssetError?: RenderOptions['onAssetError'],
): Promise<Map<string, LoadedFont>> {
  return new Map();
}

export async function loadFonts(
  doc: PDFDocument,
  declarations: FontDeclaration[],
  resolver: AssetResolver,
  onAssetError?: RenderOptions['onAssetError'],
): Promise<Map<string, LoadedFont>> {
  if (declarations.length > 0) {
    doc.registerFontkit(fontkitLib);
  }

  const fonts = new Map<string, LoadedFont>();

  for (const decl of declarations) {
    const loaded = await loadCustomFont(doc, decl, resolver, onAssetError);
    if (loaded) {
      const weight = declWeight(decl.weight);
      const style: 'normal' | 'italic' = decl.style ?? 'normal';
      fonts.set(fontKey(decl.family, weight, style), loaded);
    }
  }

  const fallbackKey = fontKey('Helvetica', 400, 'normal');
  if (!fonts.has(fallbackKey)) {
    const fallback = await loadStandardFont(doc, 'Helvetica', 400, 'normal');
    fonts.set(fallbackKey, fallback);
  }

  return fonts;
}
