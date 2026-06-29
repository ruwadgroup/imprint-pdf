import fontkitLib from '@pdf-lib/fontkit';
import type { PDFDocument } from 'pdf-lib';
import type { AssetResolver, FontDeclaration, RenderOptions } from '../types.js';
import { reportAssetError } from '../writer/drawImage.js';
// Shared font primitives (metrics, keying, weight parsing, family resolution,
// the standard-font set, and selectFont) live in font-common so the node and
// browser loaders stay in sync - this file only adds node-specific embedding.
import {
  DEFAULT_METRICS,
  declWeight,
  embedStandardFontSet,
  type FontMetrics,
  fontKey,
  getStandardFontMetrics,
  type LoadedFont,
  ttfFallbackUrl,
} from './font-common.js';
import { createHbFont } from './shaper.js';

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
      console.warn(
        `[imprint] WOFF2 decoder rejected "${decl.family}" (${decl.src}); ` +
          `retrying with ${fallback}.`,
      );
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

  // pdf-lib doesn't expose metrics publicly — reach into the embedder. The
  // field got renamed across minor versions, so check both.
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

// HarfBuzz-only loader: layout needs glyph advances before a `PDFDocument`
// exists, and embedding (subsetting, CFF parsing) is the slow part — skip it.
export async function loadFontMetricsOnly(
  declarations: FontDeclaration[],
  resolver: AssetResolver,
  onAssetError?: RenderOptions['onAssetError'],
): Promise<Map<string, LoadedFont>> {
  // Seed with real standard-font widths so the layout pass measures Helvetica/
  // Times/Courier identically to how the writer draws them. Copy the cached set
  // so per-render custom fonts don't mutate it.
  const fonts = new Map<string, LoadedFont>(await getStandardFontMetrics());
  for (const decl of declarations) {
    try {
      const bytes = await resolver.resolve(decl.src);
      const weight = declWeight(decl.weight);
      const style: 'normal' | 'italic' = decl.style ?? 'normal';
      fonts.set(fontKey(decl.family, weight, style), {
        family: decl.family,
        weight,
        style,
        metrics: DEFAULT_METRICS,
        hbFont: await createHbFont(bytes),
      });
    } catch (err) {
      reportAssetError({ src: decl.src, kind: 'font', error: err }, onAssetError);
    }
  }
  return fonts;
}

export async function loadFonts(
  doc: PDFDocument,
  declarations: FontDeclaration[],
  resolver: AssetResolver,
  onAssetError?: RenderOptions['onAssetError'],
): Promise<Map<string, LoadedFont>> {
  // fontkit is only needed for non-StandardFonts — skip registering it when
  // every font is Helvetica/Times/Courier.
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

  for (const f of fonts.values()) {
    if (f.rawBytes !== undefined) f.hbFont = await createHbFont(f.rawBytes);
  }

  return fonts;
}
