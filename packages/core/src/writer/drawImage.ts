import type { PDFDocument, PDFPage } from 'pdf-lib';
import type { AssetResolver, ComputedGeometry, ImageNode } from '../types.js';
import { pdfY } from './coords.js';

/**
 * Resolves CSS `object-position` to a [posX, posY] pair in [0, 1] space, where
 * 0 means top/left, 1 means bottom/right, and 0.5 is center. Both the fit
 * algorithm (contain/cover/etc.) and the caller use this fraction the same
 * way, so we never need to know the raw px values downstream.
 */
function parseObjectPosition(
  css: string,
  containerW: number,
  containerH: number,
): [number, number] {
  if (!css || css === 'center') return [0.5, 0.5];
  const parts = css.trim().split(/\s+/);
  const resolve = (part: string | undefined, dim: number): number => {
    if (!part) return 0.5;
    if (part === 'center') return 0.5;
    if (part === 'left' || part === 'top') return 0;
    if (part === 'right' || part === 'bottom') return 1;
    if (part.endsWith('%')) return parseFloat(part) / 100;
    const px = parseFloat(part);
    return Number.isNaN(px) ? 0.5 : dim > 0 ? px / dim : 0.5;
  };
  return [resolve(parts[0], containerW), resolve(parts[1] ?? parts[0], containerH)];
}

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
    const objectPosition = (node.props.objectPosition as string | undefined) ?? 'center center';
    const [posX, posY] = parseObjectPosition(objectPosition, width, height);

    let drawX = x;
    let drawY = pdfYPos;
    let drawW = width;
    let drawH = height;

    if (objectFit === 'contain') {
      const aspect = image.width / image.height;
      const ca = width / height;
      if (aspect > ca) {
        drawW = width;
        drawH = width / aspect;
        drawY = pdfYPos + (height - drawH) * posY;
      } else {
        drawH = height;
        drawW = height * aspect;
        drawX = x + (width - drawW) * posX;
      }
    } else if (objectFit === 'cover') {
      const aspect = image.width / image.height;
      const ca = width / height;
      if (aspect > ca) {
        drawH = height;
        drawW = height * aspect;
        // Image is wider than the box: it overflows horizontally and
        // posX controls which slice of the overflow is visible.
        drawX = x - (drawW - width) * posX;
      } else {
        drawW = width;
        drawH = width / aspect;
        drawY = pdfYPos - (drawH - height) * posY;
      }
    } else if (objectFit === 'none') {
      drawW = image.width;
      drawH = image.height;
      drawX = x + (width - drawW) * posX;
      drawY = pdfYPos + (height - drawH) * posY;
    } else if (objectFit === 'scale-down') {
      // scale-down = whichever of `none` or `contain` produces the smaller
      // rendered size. If the image already fits, don't upscale it.
      const aspect = image.width / image.height;
      const ca = width / height;
      if (image.width <= width && image.height <= height) {
        drawW = image.width;
        drawH = image.height;
        drawX = x + (width - drawW) * posX;
        drawY = pdfYPos + (height - drawH) * posY;
      } else {
        if (aspect > ca) {
          drawW = width;
          drawH = width / aspect;
          drawY = pdfYPos + (height - drawH) * posY;
        } else {
          drawH = height;
          drawW = height * aspect;
          drawX = x + (width - drawW) * posX;
        }
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
