import type { PDFPage } from 'pdf-lib';
import { degrees, rgb } from 'pdf-lib';
import type { ComputedGeometry, TextNode } from '../types.js';
import type { LoadedFont } from '../typography/fonts.js';
import { selectFont } from '../typography/fonts.js';
import { measureText } from '../typography/text.js';
import { parseColor, toPt } from './color.js';
import { alignTextX } from './coords.js';

function firstFontFamily(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return (
    value
      .split(',')[0]!
      .trim()
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
  const opacity = style.opacity !== undefined ? parseFloat(String(style.opacity)) : 1;
  const textAlign = (style.textAlign as string | undefined) ?? 'left';
  const wrapWidth = geo.width - geo.paddingLeft - geo.paddingRight;
  const metrics = measureText(node.text, style, wrapWidth, loadedFont);

  // Vertical writing mode rotates each line 90° and stacks columns. Layout
  // still measures horizontally — full vertical line stacking is v0.4 work.
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
  // 1/20 of font-size matches what browsers settle on; clamp at 0.5pt so it
  // doesn't disappear at common print resolutions.
  const decorationThickness = Math.max(0.5, fontSize / 20);

  for (const line of metrics.lines) {
    const xOffset = line.xOffset ?? 0;
    const lineX = alignTextX(
      textAlign,
      geo.x + geo.paddingLeft + xOffset,
      wrapWidth - xOffset,
      line.width,
    );
    const lineY = pageHeight - (geo.y + geo.paddingTop + line.y + fontSize);
    // One-fontSize slop on each side keeps edge-straddling glyphs intact.
    if (lineY < -fontSize || lineY > pageHeight + fontSize) continue;

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

    if (hasUnderline) {
      page.drawLine({
        start: { x: lineX, y: lineY - fontSize * 0.12 },
        end: { x: lineEnd, y: lineY - fontSize * 0.12 },
        thickness: decorationThickness,
        color,
        opacity,
      });
    }
    if (hasStrikethrough) {
      page.drawLine({
        start: { x: lineX, y: lineY + fontSize * 0.38 },
        end: { x: lineEnd, y: lineY + fontSize * 0.38 },
        thickness: decorationThickness,
        color,
        opacity,
      });
    }
    if (hasOverline) {
      page.drawLine({
        start: { x: lineX, y: lineY + fontSize * 1.05 },
        end: { x: lineEnd, y: lineY + fontSize * 1.05 },
        thickness: decorationThickness,
        color,
        opacity,
      });
    }
  }
}
