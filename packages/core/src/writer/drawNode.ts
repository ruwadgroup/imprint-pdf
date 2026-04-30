import type { PDFDocument, PDFPage } from 'pdf-lib';
import type {
  AssetResolver,
  CheckboxNode,
  ComputedGeometry,
  ImageNode,
  LinkNode,
  PdfNode,
  TextFieldNode,
  TextNode,
} from '../types.js';
import type { LoadedFont } from '../typography/fonts.js';
import { parseColor, toPt } from './color.js';
import { pdfY } from './coords.js';
import { drawCheckbox, drawTextField } from './drawForms.js';
import { drawImage } from './drawImage.js';
import { drawLink } from './drawLink.js';
import { drawText } from './drawText.js';

function drawBackground(
  page: PDFPage,
  geo: { x: number; y: number; width: number; height: number },
  pdfYPos: number,
  style: Record<string, unknown>,
): void {
  const bgColor = parseColor(style.backgroundColor as string | undefined);
  const allBorderW =
    style.borderWidth !== undefined ? toPt(style.borderWidth as string | number, 0) : 0;
  const allBorderColor = parseColor(
    (style.borderColor ?? style.borderTopColor) as string | undefined,
  );

  if (bgColor || (allBorderColor && allBorderW > 0)) {
    page.drawRectangle({
      x: geo.x,
      y: pdfYPos,
      width: Math.max(0, geo.width),
      height: Math.max(0, geo.height),
      ...(bgColor ? { color: bgColor } : {}),
      ...(allBorderColor && allBorderW > 0
        ? { borderColor: allBorderColor, borderWidth: allBorderW }
        : {}),
      ...(style.opacity !== undefined ? { opacity: parseFloat(String(style.opacity)) } : {}),
    });
  }

  // Individual border sides — only when borderWidth (all-sides) is NOT set
  if (allBorderW > 0) return;

  const sides = [
    {
      wKey: 'borderTopWidth',
      cKey: 'borderTopColor',
      x1: geo.x,
      y1: pdfYPos + geo.height,
      x2: geo.x + geo.width,
      y2: pdfYPos + geo.height,
    },
    {
      wKey: 'borderBottomWidth',
      cKey: 'borderBottomColor',
      x1: geo.x,
      y1: pdfYPos,
      x2: geo.x + geo.width,
      y2: pdfYPos,
    },
    {
      wKey: 'borderLeftWidth',
      cKey: 'borderLeftColor',
      x1: geo.x,
      y1: pdfYPos,
      x2: geo.x,
      y2: pdfYPos + geo.height,
    },
    {
      wKey: 'borderRightWidth',
      cKey: 'borderRightColor',
      x1: geo.x + geo.width,
      y1: pdfYPos,
      x2: geo.x + geo.width,
      y2: pdfYPos + geo.height,
    },
  ] as const;

  for (const side of sides) {
    const w = style[side.wKey] !== undefined ? toPt(style[side.wKey] as string | number, 0) : 0;
    if (w <= 0) continue;
    const c =
      parseColor(style[side.cKey] as string | undefined) ??
      parseColor(style.borderColor as string | undefined);
    if (!c) continue;
    page.drawLine({
      start: { x: side.x1, y: side.y1 },
      end: { x: side.x2, y: side.y2 },
      thickness: w,
      color: c,
    });
  }
}

export async function drawNode(
  node: PdfNode,
  page: PDFPage,
  pageHeight: number,
  geometries: Map<string, ComputedGeometry>,
  fonts: Map<string, LoadedFont>,
  doc: PDFDocument,
  resolver: AssetResolver,
  inheritedStyle: Record<string, unknown> = {},
): Promise<void> {
  const geo = geometries.get(node.id);
  if (!geo) return;

  const style =
    node.type === 'text' ? ({ ...inheritedStyle, ...node.style } as typeof node.style) : node.style;

  const pdfYPos = pdfY(pageHeight, geo.y, geo.height);

  if (node.type !== 'text' && node.type !== 'image') {
    drawBackground(page, geo, pdfYPos, style as Record<string, unknown>);
  }

  switch (node.type) {
    case 'text':
      await drawText(node as TextNode, style, page, pageHeight, geo, fonts);
      break;
    case 'image':
      await drawImage(node as ImageNode, page, pageHeight, geo, resolver, doc);
      break;
    case 'link':
      drawLink(node as LinkNode, page, pageHeight, geo);
      break;
    case 'textfield':
      drawTextField(node as TextFieldNode, page, doc, pageHeight, geo);
      break;
    case 'checkbox':
      drawCheckbox(node as CheckboxNode, page, doc, pageHeight, geo);
      break;
  }

  if (node.type !== 'document') {
    const childInherited = { ...inheritedStyle, ...node.style };
    for (const child of node.children) {
      await drawNode(child, page, pageHeight, geometries, fonts, doc, resolver, childInherited);
    }
  }
}
