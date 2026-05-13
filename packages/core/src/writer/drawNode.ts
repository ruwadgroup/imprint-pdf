import type { PDFDocument, PDFPage } from 'pdf-lib';
import {
  clip,
  concatTransformationMatrix,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
} from 'pdf-lib';
import type {
  AssetResolver,
  ButtonNode,
  CheckboxNode,
  ComputedGeometry,
  DropdownNode,
  ImageNode,
  LinkNode,
  PdfNode,
  RadioGroupNode,
  RenderOptions,
  SignatureNode,
  TextFieldNode,
  TextNode,
} from '../types.js';
import type { LoadedFont } from '../typography/fonts.js';
import { parseColor, toPt } from './color.js';
import { pdfY } from './coords.js';
import {
  drawButton,
  drawCheckbox,
  drawDropdown,
  drawRadioGroup,
  drawSignature,
  drawTextField,
} from './drawForms.js';
import { drawImage, reportAssetError } from './drawImage.js';
import { drawLink } from './drawLink.js';
import { drawText } from './drawText.js';
import { drawSvgString } from './svg/drawSvg.js';
import { getSvgRasterizer, needsRasterization } from './svg/rasterize-slot.js';
import { buildTransformMatrix } from './transform.js';

// pdf-lib's drawRectangle only supports a uniform radius; emit a path so each
// corner can have its own. Coordinates are y-down (layout space).
function roundedRectPath(
  x: number,
  svgY: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number,
): string {
  // CSS-spec radius clamping.
  const maxR = Math.min(w / 2, h / 2);
  tl = Math.min(Math.max(0, tl), maxR);
  tr = Math.min(Math.max(0, tr), maxR);
  br = Math.min(Math.max(0, br), maxR);
  bl = Math.min(Math.max(0, bl), maxR);
  return [
    `M ${x + tl} ${svgY}`,
    `H ${x + w - tr}`,
    `Q ${x + w} ${svgY} ${x + w} ${svgY + tr}`,
    `V ${svgY + h - br}`,
    `Q ${x + w} ${svgY + h} ${x + w - br} ${svgY + h}`,
    `H ${x + bl}`,
    `Q ${x} ${svgY + h} ${x} ${svgY + h - bl}`,
    `V ${svgY + tl}`,
    `Q ${x} ${svgY} ${x + tl} ${svgY}`,
    `Z`,
  ].join(' ');
}

// CSS box-shadow grammar: `[dx] [dy] [blur?] [spread?] [color?]`. We render
// only the offset + spread — PDF has no native blur, and `inset` shadows
// would require clipping the inverse.
interface Shadow {
  dx: number;
  dy: number;
  spread: number;
  color: ReturnType<typeof parseColor>;
  opacity: number;
}

function parseBoxShadow(css: string): Shadow | null {
  if (!css || css === 'none') return null;
  const colorMatch = css.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|\b\w+\b(?=\s+\d)/);
  const nums = css.match(/-?[\d.]+px|-?[\d.]+pt|-?[\d.]+/g) ?? [];
  if (nums.length < 2) return null;
  const dx = parseFloat(nums[0] ?? '0');
  const dy = parseFloat(nums[1] ?? '0');
  const spread = nums.length >= 4 ? parseFloat(nums[3] ?? '0') : 0;
  const colorStr = colorMatch?.[0] ?? 'rgba(0,0,0,0.3)';
  const color = parseColor(colorStr);
  // Pull alpha out of rgba() so it can be applied as ExtGState opacity.
  const rgbaMatch = colorStr.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
  const opacity = rgbaMatch ? parseFloat(rgbaMatch[1] ?? '1') : 0.3;
  return { dx, dy, spread, color, opacity };
}

function resolveRadius(style: Record<string, unknown>, key: string, fallback: number): number {
  const v = style[key];
  if (v === undefined) return fallback;
  return toPt(v as string | number, 0);
}

function drawBackground(
  page: PDFPage,
  geo: { x: number; y: number; width: number; height: number },
  pdfYPos: number,
  pageHeight: number,
  style: Record<string, unknown>,
): void {
  const bgColor = parseColor(style.backgroundColor as string | undefined);
  const allBorderW =
    style.borderWidth !== undefined ? toPt(style.borderWidth as string | number, 0) : 0;
  const allBorderColor = parseColor(
    (style.borderColor ?? style.borderTopColor) as string | undefined,
  );

  const uniformR =
    style.borderRadius !== undefined ? toPt(style.borderRadius as string | number, 0) : 0;
  const tl = resolveRadius(style, 'borderTopLeftRadius', uniformR);
  const tr = resolveRadius(style, 'borderTopRightRadius', uniformR);
  const br = resolveRadius(style, 'borderBottomRightRadius', uniformR);
  const bl = resolveRadius(style, 'borderBottomLeftRadius', uniformR);
  const hasRadius = tl > 0 || tr > 0 || br > 0 || bl > 0;
  const opacity = style.opacity !== undefined ? parseFloat(String(style.opacity)) : undefined;

  if (bgColor || (allBorderColor && allBorderW > 0)) {
    if (hasRadius) {
      // y = pageHeight makes drawSvgPath's `scale(1,-1)` map y-down layout
      // coords directly to PDF y-up. y=0 (the default) would flip below the page.
      const path = roundedRectPath(
        geo.x,
        geo.y,
        Math.max(0, geo.width),
        Math.max(0, geo.height),
        tl,
        tr,
        br,
        bl,
      );
      page.drawSvgPath(path, {
        x: 0,
        y: pageHeight,
        ...(bgColor ? { color: bgColor } : {}),
        ...(allBorderColor && allBorderW > 0
          ? { borderColor: allBorderColor, borderWidth: allBorderW }
          : {}),
        ...(opacity !== undefined ? { opacity, borderOpacity: opacity } : {}),
      });
    } else {
      page.drawRectangle({
        x: geo.x,
        y: pdfYPos,
        width: Math.max(0, geo.width),
        height: Math.max(0, geo.height),
        ...(bgColor ? { color: bgColor } : {}),
        ...(allBorderColor && allBorderW > 0
          ? { borderColor: allBorderColor, borderWidth: allBorderW }
          : {}),
        ...(opacity !== undefined ? { opacity } : {}),
      });
    }
  }

  // The uniform stroke above already drew every side; per-side strokes would double up.
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

// PDF clipping is whole-region only. Asymmetric `overflow-x/y: hidden`
// degrades to no clip rather than truncating one axis surprisingly.
function shouldClip(style: Record<string, unknown>): boolean {
  const ov = style.overflow as string | undefined;
  const ovX = style.overflowX as string | undefined;
  const ovY = style.overflowY as string | undefined;
  if (ov === 'hidden') return true;
  if (ovX === 'hidden' && (ovY === 'hidden' || ovY === undefined)) return true;
  if (ovY === 'hidden' && (ovX === 'hidden' || ovX === undefined)) return true;
  return false;
}

// `url(...)` only — repeat / position / size / gradients are out of scope.
async function drawBackgroundImage(
  page: PDFPage,
  geo: { x: number; y: number; width: number; height: number },
  pdfYPos: number,
  css: string,
  resolver: AssetResolver,
  doc: PDFDocument,
  onAssetError?: RenderOptions['onAssetError'],
): Promise<void> {
  const urlMatch = css.match(/url\(['"]?([^'")\s]+)['"]?\)/);
  if (!urlMatch?.[1]) return;
  const src = urlMatch[1];
  try {
    const bytes = await resolver.resolve(src);
    // PNG signature 89 50; anything else assumed JPEG (WebP/AVIF not supported).
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    page.drawImage(img, {
      x: geo.x,
      y: pdfYPos,
      width: Math.max(0.1, geo.width),
      height: Math.max(0.1, geo.height),
    });
  } catch (err) {
    reportAssetError({ src, kind: 'background-image', error: err }, onAssetError);
  }
}

/**
 * Walks the laid-out tree, emitting PDF operators per node in CSS paint order:
 * box-shadow, graphics-state push (CTM + clip), background, border,
 * background-image, content, children, pop.
 */
export async function drawNode(
  node: PdfNode,
  page: PDFPage,
  pageHeight: number,
  geometries: Map<string, ComputedGeometry>,
  fonts: Map<string, LoadedFont>,
  doc: PDFDocument,
  resolver: AssetResolver,
  inheritedStyle: Record<string, unknown> = {},
  namedDests?: Map<string, PDFPage>,
  onAssetError?: RenderOptions['onAssetError'],
): Promise<void> {
  const geo = geometries.get(node.id);
  if (!geo) return;

  // Only text inherits cascading style — other nodes carry their fully resolved style.
  const style =
    node.type === 'text' ? ({ ...inheritedStyle, ...node.style } as typeof node.style) : node.style;

  const styleRecord = style as Record<string, unknown>;
  const pdfYPos = pdfY(pageHeight, geo.y, geo.height);
  const hasClip = node.type !== 'text' && shouldClip(styleRecord);

  // box-shadow paints before the graphics-state push so it isn't clipped by
  // its own element's overflow (CSS behavior).
  if (node.type !== 'text' && node.type !== 'image') {
    const shadowCss = styleRecord.boxShadow as string | undefined;
    if (shadowCss) {
      const shadow = parseBoxShadow(shadowCss);
      if (shadow?.color) {
        const sx = geo.x + shadow.dx - shadow.spread;
        const sy = pdfYPos - shadow.dy - shadow.spread;
        const sw = geo.width + 2 * shadow.spread;
        const sh = geo.height + 2 * shadow.spread;
        page.drawRectangle({
          x: sx,
          y: sy,
          width: Math.max(0, sw),
          height: Math.max(0, sh),
          color: shadow.color,
          opacity: shadow.opacity,
        });
      }
    }
  }

  // Single q/Q pair for transform + clip — both live in graphics state.
  const transformCss =
    node.type !== 'text' ? (styleRecord.transform as string | undefined) : undefined;
  const hasCssTransform = Boolean(transformCss);
  if (hasCssTransform || hasClip) {
    page.pushOperators(pushGraphicsState());
    if (hasCssTransform && transformCss) {
      // CSS rotates/scales around the element's center; buildTransformMatrix
      // bakes that origin offset into the CTM.
      const ox = geo.x + geo.width / 2;
      const oy = pdfYPos + geo.height / 2;
      const m = buildTransformMatrix(transformCss, ox, oy);
      if (m) {
        page.pushOperators(concatTransformationMatrix(m[0], m[1], m[2], m[3], m[4], m[5]));
      }
    }
    if (hasClip) {
      // `W` sets the clip; pair with `n` so the path isn't also painted.
      page.pushOperators(
        rectangle(geo.x, pdfYPos, Math.max(0, geo.width), Math.max(0, geo.height)),
        clip(),
        endPath(),
      );
    }
  }

  if (node.type !== 'text' && node.type !== 'image') {
    drawBackground(page, geo, pdfYPos, pageHeight, styleRecord);
  }

  if (node.type !== 'text') {
    const bgImg = styleRecord.backgroundImage as string | undefined;
    if (bgImg && bgImg !== 'none') {
      await drawBackgroundImage(page, geo, pdfYPos, bgImg, resolver, doc, onAssetError);
    }
  }

  switch (node.type) {
    case 'text':
      await drawText(node as TextNode, style, page, pageHeight, geo, fonts);
      break;
    case 'image':
      await drawImage(node as ImageNode, page, pageHeight, geo, resolver, doc, onAssetError);
      break;
    case 'link':
      drawLink(node as LinkNode, page, pageHeight, geo, doc, namedDests);
      break;
    case 'textfield':
      drawTextField(node as TextFieldNode, page, doc, pageHeight, geo);
      break;
    case 'checkbox':
      drawCheckbox(node as CheckboxNode, page, doc, pageHeight, geo);
      break;
    case 'radiogroup':
      drawRadioGroup(node as RadioGroupNode, page, doc, pageHeight, geo);
      break;
    case 'dropdown':
      drawDropdown(node as DropdownNode, page, doc, pageHeight, geo);
      break;
    case 'button':
      drawButton(node as ButtonNode, page, doc, pageHeight, geo);
      break;
    case 'signature':
      drawSignature(node as SignatureNode, page, doc, pageHeight, geo);
      break;
    case 'svg':
    case 'chart': {
      const src = (node.props as { src?: string } | undefined)?.src;
      if (typeof src === 'string' && src.trim().startsWith('<')) {
        try {
          const rasterizer = getSvgRasterizer();
          if (rasterizer && needsRasterization(src)) {
            // 2× density for retina-grade zoom in PDF readers.
            const pxW = Math.max(1, Math.round(geo.width * 2));
            const pxH = Math.max(1, Math.round(geo.height * 2));
            const png = await rasterizer(src, { width: pxW, height: pxH });
            const img = await doc.embedPng(png);
            page.drawImage(img, { x: geo.x, y: pdfYPos, width: geo.width, height: geo.height });
          } else {
            drawSvgString(
              src,
              page,
              { x: geo.x, y: geo.y, width: geo.width, height: geo.height },
              pageHeight,
            );
          }
        } catch (err) {
          // The rasterizer path can still throw (sharp/network); fail-soft so
          // the rest of the page renders. drawSvgString itself never throws.
          reportAssetError({ src: src ?? '<inline svg>', kind: 'svg', error: err }, onAssetError);
        }
      }
      break;
    }
  }

  // <Document> children are pages, drawn separately — recursing here would
  // stack every page onto every other.
  if (node.type !== 'document') {
    const childInherited = { ...inheritedStyle, ...node.style };
    for (const child of node.children) {
      await drawNode(
        child,
        page,
        pageHeight,
        geometries,
        fonts,
        doc,
        resolver,
        childInherited,
        namedDests,
        onAssetError,
      );
    }
  }

  if (hasCssTransform || hasClip) {
    page.pushOperators(popGraphicsState());
  }
}
