import type { Color, PDFPage } from 'pdf-lib';
import { degrees, rgb } from 'pdf-lib';
import type { ComputedGeometry, TextNode } from '../types.js';
import type { LoadedFont } from '../typography/font-common.js';
import { selectFont } from '../typography/font-common.js';
import { measureText } from '../typography/text.js';
import { normalizeOpacity, parseColor, toPt } from './color.js';
import { alignTextX } from './coords.js';

interface TextShadow {
  dx: number;
  dy: number;
  color: Color;
}

/** Split on top-level commas, ignoring those nested in `rgb(...)` etc. */
function splitShadowList(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(input.slice(start).trim());
  return out;
}

/** Parse a CSS `text-shadow` value into drawable offset+colour layers (blur is
 * dropped - PDF has no blur). Offsets resolve px/pt; colour falls back to the
 * text colour when omitted. */
function parseTextShadows(value: string | undefined, fallback: Color): TextShadow[] {
  if (!value || value === 'none') return [];
  const layers: TextShadow[] = [];
  for (const part of splitShadowList(value)) {
    if (!part) continue;
    const tokens = part.split(/\s+/);
    const lengths: string[] = [];
    const colorToks: string[] = [];
    for (const t of tokens) {
      if (/^-?[\d.]+(px|pt|rem|em)?$/.test(t)) lengths.push(t);
      else colorToks.push(t);
    }
    if (lengths.length < 2) continue;
    layers.push({
      dx: toPt(lengths[0], 0),
      dy: toPt(lengths[1], 0),
      color: parseColor(colorToks.join(' ')) ?? fallback,
    });
  }
  return layers;
}

function firstFontFamily(value: string | undefined): string | undefined {
  return (
    value
      ?.split(',')[0]
      ?.trim()
      .replace(/^['"]|['"]$/g, '') || undefined
  );
}

export async function drawText(
  node: TextNode,
  style: typeof node.style,
  page: PDFPage,
  pageHeight: number,
  geo: ComputedGeometry,
  fonts: Map<string, LoadedFont>,
): Promise<void> {
  const fontFamily =
    firstFontFamily(style.fontFamily as string | undefined) ?? geo.fontFamily ?? 'Helvetica';
  const fontWeight = style.fontWeight !== undefined ? parseInt(String(style.fontWeight), 10) : 400;
  const fontStyle = (style.fontStyle as 'normal' | 'italic' | undefined) ?? 'normal';
  const fontSize = toPt(style.fontSize as string | number | undefined, 12);

  const loadedFont = selectFont(fonts, fontFamily, fontWeight, fontStyle);
  if (!loadedFont?.pdfFont) return;

  const color = parseColor(style.color as string | undefined) ?? rgb(0, 0, 0);
  const opacity = normalizeOpacity(style.opacity) ?? 1;
  const textAlign = (style.textAlign as string | undefined) ?? 'left';
  const wrapWidth = geo.width - geo.paddingLeft - geo.paddingRight;
  const metrics = measureText(node.text, style, wrapWidth, loadedFont);

  // Vertical writing mode rotates each line 90° and stacks columns.
  // Layout still measures horizontally — full vertical stacking is v0.4 work.
  const writingMode = (style.writingMode as string | undefined) ?? 'horizontal-tb';
  const vertical = writingMode === 'vertical-rl' || writingMode === 'vertical-lr';
  if (vertical) {
    const rtlStack = writingMode === 'vertical-rl';
    const baseX = geo.x + (rtlStack ? geo.width - geo.paddingRight : geo.paddingLeft);
    for (const line of metrics.lines) {
      const lineX = baseX + (rtlStack ? -line.y - fontSize : line.y);
      const lineY = pageHeight - (geo.y + geo.paddingTop);
      page.drawText(line.text, {
        x: lineX,
        y: lineY,
        font: loadedFont.pdfFont,
        size: fontSize,
        color,
        opacity,
        rotate: degrees(-90),
      });
    }
    return;
  }

  const decoration = (style.textDecoration as string | undefined) ?? '';
  const hasUnderline = decoration.includes('underline');
  const hasStrikethrough = decoration.includes('line-through');
  const hasOverline = decoration.includes('overline');
  // `fontSize / 20` matches browsers; floor at 0.5pt so it doesn't vanish in print.
  const decorationThickness = Math.max(0.5, fontSize / 20);

  // text-shadow layers, parsed once. CSS paints the first listed shadow on top,
  // so reverse the list to draw furthest-back first.
  const textShadows = parseTextShadows(style.textShadow as string | undefined, color).reverse();

  for (const line of metrics.lines) {
    const xOffset = line.xOffset ?? 0;
    const lineX = alignTextX(
      textAlign,
      geo.x + geo.paddingLeft + xOffset,
      wrapWidth - xOffset,
      line.width,
    );
    const lineY = pageHeight - (geo.y + geo.paddingTop + line.y + metrics.baseline);
    // One-fontSize slop each side so edge-straddling glyphs survive.
    if (lineY < -fontSize || lineY > pageHeight + fontSize) continue;

    // text-shadow: draw each shadow layer behind the glyphs (back to front).
    // PDF has no blur, so only the offset + colour are reproduced.
    for (const sh of textShadows) {
      page.drawText(line.text, {
        x: lineX + sh.dx,
        y: lineY - sh.dy,
        font: loadedFont.pdfFont,
        size: fontSize,
        color: sh.color,
        opacity,
        lineHeight: metrics.lineHeight,
      });
    }

    page.drawText(line.text, {
      x: lineX,
      y: lineY,
      font: loadedFont.pdfFont,
      size: fontSize,
      color,
      opacity,
      lineHeight: metrics.lineHeight,
    });

    if (!line.width || !(hasUnderline || hasStrikethrough || hasOverline)) continue;

    const lineEnd = lineX + line.width;
    const drawDecoration = (yOffset: number): void => {
      const y = lineY + yOffset;
      page.drawLine({
        start: { x: lineX, y },
        end: { x: lineEnd, y },
        thickness: decorationThickness,
        color,
        opacity,
      });
    };

    if (hasUnderline) drawDecoration(-fontSize * 0.12);
    if (hasStrikethrough) drawDecoration(fontSize * 0.38);
    if (hasOverline) drawDecoration(fontSize * 1.05);
  }
}
