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
import { drawImage } from './drawImage.js';
import { drawLink } from './drawLink.js';
import { drawText } from './drawText.js';
import { buildTransformMatrix } from './transform.js';

// ---------------------------------------------------------------------------
// Per-corner rounded rectangle
//
// pdf-lib's drawRectangle takes a single radius for all four corners, which
// isn't enough for `border-top-left-radius` & friends. We emit an SVG path
// instead and feed it to drawSvgPath. The path uses y-down layout coordinates
// (origin at top-left); the call site is responsible for translating into
// PDF y-up space.
// ---------------------------------------------------------------------------

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
  // CSS clamps each radius to half the shorter side so opposing corners can't
  // overlap. We do the same, then floor at zero — negative radii are invalid.
  const maxR = Math.min(w / 2, h / 2);
  tl = Math.min(Math.max(0, tl), maxR);
  tr = Math.min(Math.max(0, tr), maxR);
  br = Math.min(Math.max(0, br), maxR);
  bl = Math.min(Math.max(0, bl), maxR);
  // Walk the perimeter clockwise from the top edge, replacing each corner
  // with a quadratic curve. Quadratic is "good enough" for radii at PDF
  // resolution; cubic would be more accurate but visually indistinguishable.
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

// ---------------------------------------------------------------------------
// box-shadow
//
// Shape: [dx] [dy] [blur?] [spread?] [color?]
//
// PDF has no native blur, and approximating one (multi-stamped semi-transparent
// rects) is expensive and looks worse than dropping it. We render shadow as a
// solid offset rect with optional spread and parse blur out of the input only
// to skip past it. `inset` shadows aren't supported either — they require
// clipping the inverse and aren't common in print-style documents.
// ---------------------------------------------------------------------------

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
  // Position 2 is blur (skipped). Position 3 is spread when there are 4 numbers.
  const spread = nums.length >= 4 ? parseFloat(nums[3] ?? '0') : 0;
  const colorStr = colorMatch?.[0] ?? 'rgba(0,0,0,0.3)';
  const color = parseColor(colorStr);
  // rgba carries alpha in-band; PDF needs it broken out as a separate ExtGState
  // value, so we pull the alpha channel here and let the caller apply it.
  const rgbaMatch = colorStr.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
  const opacity = rgbaMatch ? parseFloat(rgbaMatch[1] ?? '1') : 0.3;
  return { dx, dy, spread, color, opacity };
}

// ---------------------------------------------------------------------------
// Background and borders
//
// Two paint modes depending on shape:
//   1. No corner radius   → drawRectangle (fast path, single PDF op).
//   2. Any corner radius  → drawSvgPath with a custom rounded-rect path so each
//                           corner can have its own radius.
//
// Per-side borders (borderTopWidth, etc.) are drawn as four independent lines
// after the fill. They're only emitted when the all-sides `borderWidth` is
// unset — otherwise drawRectangle/drawSvgPath has already stroked the outline.
// ---------------------------------------------------------------------------

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

  // CSS shorthand precedence: per-corner overrides shorthand `borderRadius`.
  // Anything left undefined falls back to the uniform value.
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
      // The path is in y-down layout space; drawSvgPath translates by
      // (options.x, options.y) and then applies scale(1, -1) to flip the y-axis.
      // Setting y = pageHeight puts the SVG origin at the page's top-left, so a
      // path coordinate (x, y) lands at PDF position (x, pageHeight - y) — the
      // exact layout-to-PDF mapping we want. Without this, the default y = 0
      // sends every coordinate below the page.
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

  // The unified rectangle/path stroke above already drew every side at the same
  // width — drawing them again would double-stroke the outline.
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

// ---------------------------------------------------------------------------
// Overflow clipping
//
// PDF clipping is binary: a region either clips its contents or it doesn't —
// no per-axis clipping like CSS. We approximate `overflow-x: hidden` etc. by
// only clipping when both axes are hidden (or one is hidden and the other is
// the implicit default). Asymmetric clipping silently degrades to no clip,
// which is the safer failure mode (visible content > truncated content).
// ---------------------------------------------------------------------------

function shouldClip(style: Record<string, unknown>): boolean {
  const ov = style.overflow as string | undefined;
  const ovX = style.overflowX as string | undefined;
  const ovY = style.overflowY as string | undefined;
  if (ov === 'hidden') return true;
  if (ovX === 'hidden' && (ovY === 'hidden' || ovY === undefined)) return true;
  if (ovY === 'hidden' && (ovX === 'hidden' || ovX === undefined)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// background-image
//
// Currently limited to `url(...)` resolved through the asset resolver. Repeat,
// position, size, and gradients are all out of scope — gradients in particular
// would need PDF shading patterns, which are a much bigger lift. The image is
// stretched to fit the box; users wanting `cover`/`contain` should use <Image>
// with object-fit instead.
// ---------------------------------------------------------------------------

async function drawBackgroundImage(
  page: PDFPage,
  geo: { x: number; y: number; width: number; height: number },
  pdfYPos: number,
  css: string,
  resolver: AssetResolver,
  doc: PDFDocument,
): Promise<void> {
  const urlMatch = css.match(/url\(['"]?([^'")\s]+)['"]?\)/);
  if (!urlMatch?.[1]) return;
  try {
    const bytes = await resolver.resolve(urlMatch[1]);
    // PNG signature is 89 50 4E 47; anything else, we assume JPEG. WebP/AVIF
    // aren't natively supported by pdf-lib and would need rasterization first.
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    page.drawImage(img, {
      x: geo.x,
      y: pdfYPos,
      width: Math.max(0.1, geo.width),
      height: Math.max(0.1, geo.height),
    });
  } catch {
    // A missing background image shouldn't break a 200-page document. Swallow
    // and let the rest of the page render without it.
  }
}

// ---------------------------------------------------------------------------
// drawNode
//
// Walks the laid-out tree and emits PDF content-stream operators for each
// node. The order of operations within a single node matters and mirrors the
// CSS painting algorithm:
//
//   1. box-shadow         (painted behind, outside clip/transform)
//   2. push graphics state + CTM/clip
//   3. background-color and borders
//   4. background-image
//   5. node-specific content (text, image, form widget, link annotation, …)
//   6. children
//   7. pop graphics state
//
// Why the graphics-state push wraps both the transform and the children:
// in PDF, the CTM is part of the graphics state, so any transform we apply
// must be undone before the next sibling is drawn. Clipping rides along on
// the same push/pop pair.
// ---------------------------------------------------------------------------

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
): Promise<void> {
  const geo = geometries.get(node.id);
  if (!geo) return;

  // Text inherits cascading style (color, font, etc.) from its ancestors;
  // every other node type already has its own resolved style and shouldn't
  // be polluted by the parent's text-only properties.
  const style =
    node.type === 'text' ? ({ ...inheritedStyle, ...node.style } as typeof node.style) : node.style;

  const styleRecord = style as Record<string, unknown>;
  const pdfYPos = pdfY(pageHeight, geo.y, geo.height);
  const hasClip = node.type !== 'text' && shouldClip(styleRecord);

  // box-shadow is painted *before* the graphics-state push so it isn't clipped
  // by its own element's overflow, which matches CSS. Text and image draw
  // their own backgrounds elsewhere — skip them here to avoid double-paint.
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

  // Push a single graphics state for transform + clip. They share the q/Q
  // pair because both modify the CTM/clip path, both want to be unwound at
  // the same time, and combining them avoids extra operator overhead.
  const transformCss =
    node.type !== 'text' ? (styleRecord.transform as string | undefined) : undefined;
  const hasCssTransform = Boolean(transformCss);
  if (hasCssTransform || hasClip) {
    page.pushOperators(pushGraphicsState());
    if (hasCssTransform && transformCss) {
      // CSS transforms rotate/scale around the element's center by default.
      // buildTransformMatrix bakes the origin offset into the resulting CTM
      // so the caller doesn't need an extra translate pair.
      const ox = geo.x + geo.width / 2;
      const oy = pdfYPos + geo.height / 2;
      const m = buildTransformMatrix(transformCss, ox, oy);
      if (m) {
        page.pushOperators(concatTransformationMatrix(m[0], m[1], m[2], m[3], m[4], m[5]));
      }
    }
    if (hasClip) {
      // The PDF clipping operator W / W* doesn't paint anything; it modifies
      // the current path into a clip path. We follow it with `n` (endPath) so
      // the path is consumed without filling or stroking it.
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
      await drawBackgroundImage(page, geo, pdfYPos, bgImg, resolver, doc);
    }
  }

  switch (node.type) {
    case 'text':
      await drawText(node as TextNode, style, page, pageHeight, geo, fonts);
      break;
    case 'image':
      await drawImage(node as ImageNode, page, pageHeight, geo, resolver, doc);
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
    case 'chart':
      // Real <svg> and <canvas> rendering needs a rasterizer (Skia/Resvg) we
      // don't ship in core. Children still recurse — most chart libraries put
      // a DOM fallback inside their <svg>, which gives us a usable result.
      break;
  }

  // <Document> is a layout root, not a paint target — its only "children"
  // are <Page> nodes, each of which is drawn separately by the writer. If we
  // recursed here we'd draw every page on top of every other page.
  if (node.type !== 'document') {
    // Style cascades down for text resolution. Non-text nodes ignore it but
    // still pass it through so nested text sees the full inherited context.
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
      );
    }
  }

  if (hasCssTransform || hasClip) {
    page.pushOperators(popGraphicsState());
  }
}
