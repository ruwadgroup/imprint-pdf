import type { PDFDocument, PDFPage } from 'pdf-lib';
import type { AssetResolver, ComputedGeometry, ImageNode } from '../types.js';
import { pdfY } from './coords.js';

export async function drawImage(
  node: ImageNode,
  page: PDFPage,
  pageHeight: number,
  geo: ComputedGeometry,
  resolver: AssetResolver,
  doc: PDFDocument,
): Promise<void> {
  const src = node.props.src;
  if (!src) return;
  try {
    const bytes = await resolver.resolve(src);
    const ext = String(src).split('.').pop()?.toLowerCase();
    const isPng = (bytes[0] === 0x89 && bytes[1] === 0x50) || ext === 'png';
    const isJpeg = (bytes[0] === 0xff && bytes[1] === 0xd8) || ext === 'jpg' || ext === 'jpeg';
    let image: Awaited<ReturnType<typeof doc.embedPng>> | undefined;
    if (isPng) {
      image = await doc.embedPng(bytes);
    } else if (isJpeg) {
      image = await doc.embedJpg(bytes);
    } else {
      try {
        image = await doc.embedPng(bytes);
      } catch {
        image = await doc.embedJpg(bytes);
      }
    }
    if (!image) return;

    const { x, y, width, height } = geo;
    const pdfYPos = pdfY(pageHeight, y, height);
    const objectFit = (node.props.objectFit as string | undefined) ?? 'contain';
    let drawX = x,
      drawY = pdfYPos,
      drawW = width,
      drawH = height;

    if (objectFit === 'contain') {
      const aspect = image.width / image.height;
      const ca = width / height;
      if (aspect > ca) {
        drawW = width;
        drawH = width / aspect;
        drawY = pdfYPos + (height - drawH) / 2;
      } else {
        drawH = height;
        drawW = height * aspect;
        drawX = x + (width - drawW) / 2;
      }
    } else if (objectFit === 'cover') {
      const aspect = image.width / image.height;
      const ca = width / height;
      if (aspect > ca) {
        drawH = height;
        drawW = height * aspect;
        drawX = x - (drawW - width) / 2;
      } else {
        drawW = width;
        drawH = width / aspect;
        drawY = pdfYPos - (drawH - height) / 2;
      }
    }

    page.drawImage(image, {
      x: drawX,
      y: drawY,
      width: Math.max(0.1, drawW),
      height: Math.max(0.1, drawH),
    });
  } catch (err) {
    console.warn(`[imprint] Failed to embed image "${src}":`, err);
  }
}
