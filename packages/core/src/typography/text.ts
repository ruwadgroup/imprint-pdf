import type { ResolvedStyle } from '../types.js';
import { detectBaseDir, hasRtlChars, reorderLine } from './bidi.js';
import { DEFAULT_METRICS, type LoadedFont } from './font-common.js';
import { getHyphenator } from './hyphen.js';
import { breakLines } from './knuth-plass.js';
import { parseVariationSettings } from './variations.js';

export interface TextLine {
  text: string;
  width: number;
  y: number;
  /** Per-line `text-indent` offset; non-zero only on the first line. */
  xOffset: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  lineHeight: number;
  lines: TextLine[];
  /** Font ascent in points (distance from baseline to the top of the em box). */
  ascent: number;
  /** Font descent in points (positive distance below the baseline). */
  descent: number;
  /**
   * Distance from a line's top edge down to its baseline, in points. Uses the
   * CSS half-leading model so the glyph optical centre coincides with the line
   * box centre - this is what makes `items-center` align text against siblings.
   */
  baseline: number;
}

// CSS length → PDF points for typography (fontSize, lineHeight, textIndent, …).
// Matches `layout/units.ts` resolvePt for px/pt/cm/mm/in but uses `fallback` as
// the em base, since typography ems are relative to the parent fontSize, not
// the container width.
function parsePx(value: string | number | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  if (typeof value === 'number') return value;
  if (value.endsWith('pt')) return parseFloat(value);
  if (value.endsWith('px')) return parseFloat(value) * 0.75; // 1px = 0.75pt
  if (value.endsWith('em')) return parseFloat(value) * fallback;
  if (value.endsWith('rem')) return parseFloat(value) * 12; // 1rem ≈ 16px = 12pt
  if (value.endsWith('mm')) return parseFloat(value) * 2.8346;
  if (value.endsWith('cm')) return parseFloat(value) * 28.346;
  if (value.endsWith('in')) return parseFloat(value) * 72;
  if (value.endsWith('%')) return (parseFloat(value) / 100) * fallback;
  const n = parseFloat(value);
  return Number.isNaN(n) ? fallback : n;
}

function charWidth(char: string, size: number, font: LoadedFont | undefined): number {
  if (font?.pdfFont) {
    try {
      return font.pdfFont.widthOfTextAtSize(char, size);
    } catch {}
  }
  // Heuristic widths used until the font embeds; real glyph widths take over after.
  const code = char.charCodeAt(0);
  if (code === 32) return size * 0.25;
  if (code >= 105 && code <= 108) return size * 0.28;
  if (code === 109 || code === 119) return size * 0.78;
  return size * 0.55;
}

function wordWidth(
  word: string,
  size: number,
  font: LoadedFont | undefined,
  variations?: Record<string, number>,
): number {
  // Prefer the pdf-lib advance: it is exactly what the writer draws, so layout
  // boxes match the rendered glyphs (no drift, no overlap). Both the layout pass
  // and the writer now carry a pdfFont. HarfBuzz is the fallback when a glyph
  // isn't measurable (and for the metrics-only path before embedding).
  if (font?.pdfFont) {
    try {
      return font.pdfFont.widthOfTextAtSize(word, size);
    } catch {}
  }
  if (font?.hbFont) {
    return font.hbFont.shapeAdvance(
      word,
      size,
      variations && Object.keys(variations).length > 0 ? { variations } : {},
    );
  }
  let w = 0;
  for (const ch of word) w += charWidth(ch, size, font);
  return w;
}

function applyTextTransform(text: string, transform: string | undefined): string {
  if (!transform || transform === 'none') return text;
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') return text.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
  return text;
}

function truncateWithEllipsis(
  words: string[],
  spaceW: number,
  maxWidth: number,
  measure: (w: string) => number,
): string {
  const ellipsis = '…';
  const ellipsisW = measure(ellipsis);
  let used = 0;
  const kept: string[] = [];
  for (const word of words) {
    const w = measure(word);
    const gap = kept.length > 0 ? spaceW : 0;
    if (used + gap + w + ellipsisW > maxWidth && kept.length > 0) break;
    if (used + gap + w > maxWidth) break;
    kept.push(word);
    used += gap + w;
  }
  return kept.join(' ') + (kept.length < words.length ? ellipsis : '');
}

export interface MeasureTextOptions {
  hyphenate?: (word: string) => string[];
}

export function measureText(
  text: string,
  style: ResolvedStyle,
  containerWidth: number,
  font: LoadedFont | undefined,
  options: MeasureTextOptions = {},
): TextMetrics {
  const size = parsePx(style.fontSize, 12);
  const lineHeightRaw = style.lineHeight;
  const lineHeight =
    lineHeightRaw === undefined
      ? size * 1.2
      : typeof lineHeightRaw === 'number'
        ? size * lineHeightRaw
        : lineHeightRaw.endsWith('px') || lineHeightRaw.endsWith('pt')
          ? parsePx(lineHeightRaw, size)
          : (parseFloat(String(lineHeightRaw)) || 1.2) * size;

  // CSS line-box: distribute leading evenly above and below the glyph run so
  // the optical centre sits at the box centre. ascent/descent come from the
  // font (fontkit metrics for embedded fonts, DEFAULT_METRICS for standard
  // ones). descent is stored negative in font units, hence the abs().
  const fm = font?.metrics ?? DEFAULT_METRICS;
  const upm = fm.unitsPerEm || 1000;
  const ascent = (fm.ascent / upm) * size;
  const descent = (Math.abs(fm.descent) / upm) * size;
  const baseline = ascent + (lineHeight - (ascent + descent)) / 2;

  const whiteSpace = (style.whiteSpace as string | undefined) ?? '';
  const textOverflow = (style.textOverflow as string | undefined) ?? '';
  const nowrap = whiteSpace === 'nowrap' || whiteSpace === 'pre';
  const ellipsis = textOverflow === 'ellipsis';

  const lineClampRaw = style.lineClamp;
  const lineClamp = lineClampRaw !== undefined ? parseInt(String(lineClampRaw), 10) : 0;

  const textIndentRaw = style.textIndent;
  const textIndent = textIndentRaw !== undefined ? parsePx(textIndentRaw, size) : 0;

  const maxWidth = nowrap || containerWidth <= 0 ? Infinity : containerWidth;

  const letterSpacingRaw = style.letterSpacing;
  let letterSpacing = 0;
  if (typeof letterSpacingRaw === 'number') {
    letterSpacing = letterSpacingRaw;
  } else if (letterSpacingRaw !== undefined) {
    const ls = String(letterSpacingRaw);
    letterSpacing = ls.endsWith('em') ? parseFloat(ls) * size : parsePx(ls, size);
  }

  const wordSpacingRaw = style.wordSpacing;
  let extraSpaceW = 0;
  if (wordSpacingRaw !== undefined) {
    const ws = typeof wordSpacingRaw === 'number' ? wordSpacingRaw : String(wordSpacingRaw);
    if (ws !== 'normal') extraSpaceW = parsePx(ws, size);
  }

  // Only EXPLICIT `font-variation-settings` feed advance measurement. The
  // weight/width are already baked into the per-weight font file picked by
  // selectFont, so auto-lifting font-weight onto the `wght` axis (which some
  // Fontsource files still expose via fvar) would make HarfBuzz measure a
  // heavier, wider instance than pdf-lib actually draws - causing centered text
  // to drift and wrapped lines to overlap. Keep measure == render.
  const variations = parseVariationSettings(style.fontVariationSettings as string | undefined);
  const measure = (w: string) =>
    wordWidth(w, size, font, variations) + [...w].length * letterSpacing;
  const spaceW = measure(' ') + extraSpaceW;

  const transform = style.textTransform as string | undefined;
  const inputText = applyTextTransform(text, transform);

  const lines: TextLine[] = [];
  let y = 0;
  let maxW = 0;
  let isFirstParagraph = true;

  for (const para of inputText.split('\n')) {
    if (lineClamp > 0 && lines.length >= lineClamp) break;

    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push({ text: '', width: 0, y, xOffset: 0 });
      y += lineHeight;
      isFirstParagraph = false;
      continue;
    }

    const baseDir = detectBaseDir(para);
    const indent = isFirstParagraph && textIndent > 0 ? textIndent : 0;

    if (nowrap) {
      let lineText = words.join(' ');
      const availW = containerWidth > 0 ? containerWidth - indent : Infinity;
      if (ellipsis && availW > 0 && Number.isFinite(availW)) {
        lineText = truncateWithEllipsis(words, spaceW, availW, measure);
      }
      const w = measure(lineText);
      if (hasRtlChars(lineText)) lineText = reorderLine(lineText, baseDir);
      lines.push({ text: lineText, width: w, y, xOffset: indent });
      maxW = Math.max(maxW, w + indent);
      y += lineHeight;
    } else {
      const hyphenate = options.hyphenate ?? getHyphenator() ?? undefined;
      const broken = breakLines(words, spaceW, spaceW * 0.5, spaceW * 0.333, maxWidth, measure, {
        ...(hyphenate ? { hyphenate } : {}),
      });
      let lineIdx = 0;
      for (const lineWords of broken) {
        if (lineClamp > 0 && lines.length >= lineClamp) break;
        if (!lineWords.length) continue;
        let lineText = lineWords.join(' ');
        const w = measure(lineText);
        const xOff = lineIdx === 0 ? indent : 0;

        // Last clamped line — re-measure with the ellipsis baked in.
        if (lineClamp > 0 && lines.length === lineClamp - 1) {
          const availW = maxWidth - xOff;
          const truncated = truncateWithEllipsis(lineWords, spaceW, availW, measure);
          const tw = measure(truncated);
          const tText = hasRtlChars(truncated) ? reorderLine(truncated, baseDir) : truncated;
          lines.push({ text: tText, width: tw, y, xOffset: xOff });
          maxW = Math.max(maxW, tw + xOff);
          y += lineHeight;
          lineIdx++;
          continue;
        }

        if (hasRtlChars(lineText)) lineText = reorderLine(lineText, baseDir);
        lines.push({ text: lineText, width: w, y, xOffset: xOff });
        maxW = Math.max(maxW, w + xOff);
        y += lineHeight;
        lineIdx++;
      }
    }

    isFirstParagraph = false;
  }

  return { width: maxW, height: y, lineHeight, lines, ascent, descent, baseline };
}
