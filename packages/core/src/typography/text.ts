import type { ResolvedStyle } from '../types.js';
import { detectBaseDir, hasRtlChars, reorderLine } from './bidi.js';
import type { LoadedFont } from './fonts.js';
import { breakLines } from './knuth-plass.js';
import { shapeAdvance } from './shaper.js';

export interface TextLine {
  text: string;
  width: number;
  y: number;
  /** x-offset from the node's left edge (used for text-indent on the first line). */
  xOffset: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  lineHeight: number;
  lines: TextLine[];
}

function parsePx(value: string | number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.endsWith('px') || value.endsWith('pt')) return parseFloat(value);
    if (value.endsWith('em')) return parseFloat(value) * fallback;
    const n = parseFloat(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function charWidth(char: string, size: number, font: LoadedFont | undefined): number {
  if (font?.pdfFont) {
    try {
      return font.pdfFont.widthOfTextAtSize(char, size);
    } catch {}
  }
  const code = char.charCodeAt(0);
  if (code === 32) return size * 0.25;
  if (code >= 105 && code <= 108) return size * 0.28;
  if (code === 109 || code === 119) return size * 0.78;
  return size * 0.55;
}

function wordWidth(word: string, size: number, font: LoadedFont | undefined): number {
  if (font?.hbFont) return shapeAdvance(font.hbFont, word, size);
  if (font?.pdfFont) {
    try {
      return font.pdfFont.widthOfTextAtSize(word, size);
    } catch {}
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

export function measureText(
  text: string,
  style: ResolvedStyle,
  containerWidth: number,
  font: LoadedFont | undefined,
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
  if (letterSpacingRaw !== undefined) {
    const ls = typeof letterSpacingRaw === 'number' ? letterSpacingRaw : String(letterSpacingRaw);
    if (typeof ls === 'number') letterSpacing = ls;
    else if (ls.endsWith('em')) letterSpacing = parseFloat(ls) * size;
    else letterSpacing = parsePx(ls, size);
  }

  const wordSpacingRaw = style.wordSpacing;
  let extraSpaceW = 0;
  if (wordSpacingRaw !== undefined) {
    const ws = typeof wordSpacingRaw === 'number' ? wordSpacingRaw : String(wordSpacingRaw);
    if (ws === 'normal') extraSpaceW = 0;
    else extraSpaceW = parsePx(ws, size);
  }

  const measure = (w: string) => wordWidth(w, size, font) + [...w].length * letterSpacing;
  const spaceW = measure(' ') + extraSpaceW;

  const transform = style.textTransform as string | undefined;
  const inputText = applyTextTransform(text, transform);

  const lines: TextLine[] = [];
  let y = 0;
  let maxW = 0;
  let isFirstParagraph = true;

  for (const para of inputText.split('\n')) {
    if (lineClamp > 0 && lines.length >= lineClamp) break;

    if (!para) {
      lines.push({ text: '', width: 0, y, xOffset: 0 });
      y += lineHeight;
      isFirstParagraph = false;
      continue;
    }

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
      if (ellipsis && availW > 0 && isFinite(availW)) {
        lineText = truncateWithEllipsis(words, spaceW, availW, measure);
      }
      const w = measure(lineText);
      if (hasRtlChars(lineText)) lineText = reorderLine(lineText, baseDir);
      lines.push({ text: lineText, width: w, y, xOffset: indent });
      maxW = Math.max(maxW, w + indent);
      y += lineHeight;
    } else {
      const broken = breakLines(words, spaceW, spaceW * 0.5, spaceW * 0.333, maxWidth, measure);
      let lineIdx = 0;
      for (const lineWords of broken) {
        if (lineClamp > 0 && lines.length >= lineClamp) break;
        if (!lineWords.length) continue;
        let lineText = lineWords.join(' ');
        const w = measure(lineText);
        const xOff = lineIdx === 0 ? indent : 0;

        // Apply ellipsis on the last clamped line
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

  return { width: maxW, height: y, lineHeight, lines };
}
