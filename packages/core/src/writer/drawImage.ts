import type { PDFDocument, PDFPage } from 'pdf-lib';
import type { AssetResolver, ComputedGeometry, ImageNode, RenderOptions } from '../types.js';
import { pdfY } from './coords.js';

/**
 * URL schemes a Node/edge runtime can never fetch — fail fast with an
 * actionable message instead of letting undici throw a generic
 * `TypeError: fetch failed` from far inside the writer.
 */
const CLIENT_ONLY_SCHEMES = ['blob:', 'data-url:', 'chrome-extension:', 'moz-extension:'];

function isClientOnlyScheme(src: string): boolean {
  return CLIENT_ONLY_SCHEMES.some((s) => src.startsWith(s));
}

/**
 * Default failure handler. Swallows the error so a broken image never aborts
 * the whole PDF render — that's almost always the wrong behaviour for
 * user-supplied content (a profile photo gone 404 shouldn't kill an invoice).
 * Consumers can override via `RenderOptions.onAssetError`.
 */
export function reportAssetError(
  info: { src: string; kind: 'image' | 'background-image' | 'font' | 'svg'; error: unknown },
  onAssetError: RenderOptions['onAssetError'],
): void {
  if (onAssetError) {
    // Intentionally do NOT catch: throwing from the hook is the supported
    // way to opt into strict mode (abort the render on broken assets).
    // Returning normally keeps the default fail-soft behaviour.
    onAssetError(info);
    return;
  }
  const reason =
    info.error instanceof Error ? info.error.message : String(info.error ?? 'unknown error');
  const hint = isClientOnlyScheme(info.src)
    ? ' (URL scheme is browser-only — fetch the bytes client-side and pass a data: URL, an https: URL, or pre-uploaded asset path instead)'
    : '';
  console.warn(`[imprint] ${info.kind} asset failed: "${info.src}" — ${reason}${hint}`);
}

/** Resolves CSS `object-position` to `[posX, posY]` in 0–1 space (0 = top/left, 1 = bottom/right). */
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
  onAssetError?: RenderOptions['onAssetError'],
): Promise<void> {
  const src = node.props.src;
  if (!src) return;
  if (isClientOnlyScheme(String(src))) {
    reportAssetError(
      {
        src: String(src),
        kind: 'image',
        error: new Error(`${String(src).split(':')[0]}: URLs are not fetchable server-side`),
      },
      onAssetError,
    );
    return;
  }
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
    // Swallow so one broken image doesn't kill the whole render. Consumers
    // who want strict-mode behaviour pass `onAssetError` and throw from there.
    reportAssetError({ src: String(src), kind: 'image', error: err }, onAssetError);
  }
}
