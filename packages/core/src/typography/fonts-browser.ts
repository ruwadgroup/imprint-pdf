import fontkitLib from '@pdf-lib/fontkit';
import { PDFDocument } from 'pdf-lib';
import type { AssetResolver, FontDeclaration, RenderOptions } from '../types.js';
import { reportAssetError } from '../writer/drawImage.js';
import {
  DEFAULT_METRICS,
  declWeight,
  embedStandardFontSet,
  type FontMetrics,
  fontKey,
  type LoadedFont,
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

// The browser has no HarfBuzz, so the layout pass must measure with the same
// embedded `pdfFont` the writer draws with. Embed into a throwaway document
// (discarded) so measure and draw compute identical glyph advances - the
// node path reuses a cached set, but here every render re-embeds since custom
// fonts vary per render.
export async function loadFontMetricsOnly(
  declarations: FontDeclaration[],
  resolver: AssetResolver,
  onAssetError?: RenderOptions['onAssetError'],
): Promise<Map<string, LoadedFont>> {
  const doc = await PDFDocument.create();
  return loadFonts(doc, declarations, resolver, onAssetError);
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

  // Embed the full standard set so font-serif/font-mono draw as real Times/
  // Courier and every (family, weight, style) has a real fallback. Custom fonts
  // declared above keep priority on shared keys.
  for (const [key, font] of await embedStandardFontSet(doc)) {
    if (!fonts.has(key)) fonts.set(key, font);
  }

  return fonts;
}
