import type { PDFPage } from 'pdf-lib';
import { rgb } from 'pdf-lib';
import type { BleedBox } from './bleed.js';

/**
 * Which printer marks to draw outside the trim. Matches the values accepted
 * by the `<Page marks>` prop and the `imprint:marks-[…]` Tailwind variant.
 */
export type MarkKind = 'crop' | 'trim' | 'bleed' | 'registration' | 'all';

export interface DrawMarksOptions {
  /** Bleed amount applied to each side of the trim, in PDF points. */
  bleed: BleedBox;
  /** Marks to render. `'all'` expands to crop + trim + registration. */
  marks: readonly MarkKind[];
  /** Tick length in points; 12 pt (≈ 4 mm) matches Adobe defaults. */
  tickLength?: number;
  /** Stroke thickness in points; 0.25 pt matches Adobe defaults. */
  thickness?: number;
}

/**
 * Sets the `MediaBox`, `BleedBox`, and `TrimBox` on a page so a press RIP can
 * find the correct extents.
 *
 * Imprint draws content inside the trim; the page is grown outward by the
 * bleed amount so live art that runs off the trim has a safety margin.
 *
 * @returns The original (unbled) trim dimensions so callers can lay marks
 *          relative to the trim corners.
 */
export function applyPageBoxes(
  page: PDFPage,
  bleed: BleedBox,
): { trim: { x: number; y: number; width: number; height: number } } {
  const { width: trimW, height: trimH } = page.getSize();

  const newW = trimW + bleed.left + bleed.right;
  const newH = trimH + bleed.top + bleed.bottom;

  page.setMediaBox(0, 0, newW, newH);
  page.setBleedBox(0, 0, newW, newH);
  page.setTrimBox(bleed.left, bleed.bottom, trimW, trimH);

  page.translateContent(bleed.left, bleed.bottom);
  return { trim: { x: bleed.left, y: bleed.bottom, width: trimW, height: trimH } };
}

/**
 * Draws crop / trim / registration / bleed marks outside the trim box.
 *
 * Pre-condition: `applyPageBoxes` must have run first so the page has been
 * grown to include the bleed area.
 */
export function drawPrintMarks(page: PDFPage, options: DrawMarksOptions): void {
  const { bleed, marks } = options;
  const tick = options.tickLength ?? 12;
  const thickness = options.thickness ?? 0.25;

  const wants = (kind: MarkKind) => marks.includes('all') || marks.includes(kind);

  const { width: pageW, height: pageH } = page.getSize();
  const trim = {
    x0: bleed.left,
    y0: bleed.bottom,
    x1: pageW - bleed.right,
    y1: pageH - bleed.top,
  };

  const black = rgb(0, 0, 0);
  const offset = 4; // gap between trim corner and start of mark
  const cropOffset = Math.max(bleed.left, bleed.right, bleed.top, bleed.bottom) - offset;

  if (wants('trim') || wants('crop')) {
    const corners: Array<[number, number, number, number]> = [
      [trim.x0 - tick - offset, trim.y0, trim.x0 - offset, trim.y0],
      [trim.x0, trim.y0 - tick - offset, trim.x0, trim.y0 - offset],
      [trim.x1 + offset, trim.y0, trim.x1 + tick + offset, trim.y0],
      [trim.x1, trim.y0 - tick - offset, trim.x1, trim.y0 - offset],
      [trim.x0 - tick - offset, trim.y1, trim.x0 - offset, trim.y1],
      [trim.x0, trim.y1 + offset, trim.x0, trim.y1 + tick + offset],
      [trim.x1 + offset, trim.y1, trim.x1 + tick + offset, trim.y1],
      [trim.x1, trim.y1 + offset, trim.x1, trim.y1 + tick + offset],
    ];
    for (const [x1, y1, x2, y2] of corners) {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: black });
    }
  }

  if (wants('crop')) {
    const cropOff = Math.max(cropOffset, offset + tick);
    const x0 = trim.x0 - cropOff;
    const x1 = trim.x1 + cropOff;
    const y0 = trim.y0 - cropOff;
    const y1 = trim.y1 + cropOff;
    const c: Array<[number, number, number, number]> = [
      [x0, trim.y0, x0 + tick, trim.y0],
      [trim.x0, y0, trim.x0, y0 + tick],
      [x1, trim.y0, x1 - tick, trim.y0],
      [trim.x1, y0, trim.x1, y0 + tick],
      [x0, trim.y1, x0 + tick, trim.y1],
      [trim.x0, y1, trim.x0, y1 - tick],
      [x1, trim.y1, x1 - tick, trim.y1],
      [trim.x1, y1, trim.x1, y1 - tick],
    ];
    for (const [a, b, c2, d] of c) {
      page.drawLine({ start: { x: a, y: b }, end: { x: c2, y: d }, thickness, color: black });
    }
  }

  if (wants('registration')) {
    const r = tick / 2;
    const targets = [
      { x: pageW / 2, y: bleed.bottom / 2 },
      { x: pageW / 2, y: pageH - bleed.top / 2 },
      { x: bleed.left / 2, y: pageH / 2 },
      { x: pageW - bleed.right / 2, y: pageH / 2 },
    ];
    for (const t of targets) {
      page.drawCircle({ x: t.x, y: t.y, size: r, borderWidth: thickness, borderColor: black });
      page.drawLine({
        start: { x: t.x - r * 1.5, y: t.y },
        end: { x: t.x + r * 1.5, y: t.y },
        thickness,
        color: black,
      });
      page.drawLine({
        start: { x: t.x, y: t.y - r * 1.5 },
        end: { x: t.x, y: t.y + r * 1.5 },
        thickness,
        color: black,
      });
    }
  }

  if (wants('bleed')) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageW,
      height: pageH,
      borderWidth: thickness,
      borderColor: black,
      borderDashArray: [3, 3],
    });
  }
}
