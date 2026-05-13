import type { PDFDict, PDFPage, PDFRef } from 'pdf-lib';
import {
  clip,
  clipEvenOdd,
  closePath,
  endPath,
  fill,
  fillAndStroke,
  PDFName,
  PDFOperator,
  popGraphicsState,
  pushGraphicsState,
  setFillingRgbColor,
  setLineWidth,
  setStrokingRgbColor,
  stroke,
} from 'pdf-lib';
import { parseColor } from '../color.js';
import { buildGradientPattern } from './gradients.js';
import { findById, parseSvg, type SvgElement } from './parser.js';
import { shapeToPath } from './paths.js';
import { IDENTITY, type Mat, multiply, parseTransform } from './transform.js';

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function parseViewBox(s: string | undefined): ViewBox | null {
  if (!s) return null;
  const v = s
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (v.length !== 4 || v.some((n) => Number.isNaN(n))) return null;
  return { x: v[0]!, y: v[1]!, w: v[2]!, h: v[3]! };
}

function attrOrStyle(el: SvgElement, name: string): string | undefined {
  if (el.attrs[name] !== undefined) return el.attrs[name];
  const style = el.attrs.style;
  if (!style) return undefined;
  const m = new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, 'i').exec(style);
  return m?.[1]?.trim();
}

function parseUrlRef(value: string | undefined): string | null {
  if (!value) return null;
  const m = /url\(['"]?#([^)'"]+)['"]?\)/.exec(value);
  return m?.[1] ?? null;
}

interface PaintRgb {
  kind: 'rgb';
  r: number;
  g: number;
  b: number;
  opacity: number;
}
interface PaintGradient {
  kind: 'gradient';
  id: string;
  opacity: number;
}
interface PaintNone {
  kind: 'none';
}
type Paint = PaintRgb | PaintGradient | PaintNone;

function resolvePaint(value: string | undefined, fallback: Paint, opacity: number): Paint {
  if (value === undefined) return fallback.kind === 'none' ? { kind: 'none' } : { ...fallback };
  const v = value.trim();
  if (v === 'none' || v === 'transparent') return { kind: 'none' };
  const ref = parseUrlRef(v);
  if (ref) return { kind: 'gradient', id: ref, opacity };
  const c = parseColor(v);
  if (!c) return { kind: 'none' };
  const any = c as { type: string; red?: number; green?: number; blue?: number; gray?: number };
  if (any.type === 'RGB')
    return { kind: 'rgb', r: any.red ?? 0, g: any.green ?? 0, b: any.blue ?? 0, opacity };
  if (any.type === 'Grayscale') {
    const g = any.gray ?? 0;
    return { kind: 'rgb', r: g, g, b: g, opacity };
  }
  return { kind: 'none' };
}

interface BBoxResult {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Approx bbox over raw coords. Béziers bulge slightly past their endpoints, but
// that's fine for `objectBoundingBox` gradient mapping.
function pathBBox(d: string): BBoxResult {
  const nums = (d.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
  if (nums.length < 2) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]!;
    const y = nums[i + 1]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

interface DrawCtx {
  page: PDFPage;
  defs: SvgElement;
  patternCounter: { n: number };
  patternNames: Map<string, string>;
}

function ensurePatternResource(ctx: DrawCtx, ref: PDFRef): string {
  const key = String(ref);
  const cached = ctx.patternNames.get(key);
  if (cached) return cached;
  const name = `Sh${++ctx.patternCounter.n}`;
  ctx.patternNames.set(key, name);
  // pdf-lib has no Pattern resource API — wire it onto the page dict ourselves.
  const node = (ctx.page as unknown as { node: PDFDict }).node;
  let resources = node.lookup(PDFName.of('Resources')) as PDFDict | undefined;
  if (!resources) {
    resources = ctx.page.doc.context.obj({}) as PDFDict;
    node.set(PDFName.of('Resources'), resources);
  }
  let patterns = resources.lookup(PDFName.of('Pattern')) as PDFDict | undefined;
  if (!patterns) {
    patterns = ctx.page.doc.context.obj({}) as PDFDict;
    resources.set(PDFName.of('Pattern'), patterns);
  }
  patterns.set(PDFName.of(name), ref);
  return name;
}

// pdf-lib doesn't expose pattern-paint operators — emit them by hand.
function op(name: string, args: unknown[] = []): PDFOperator {
  return PDFOperator.of(name as never, args as never[]);
}
function setFillingColorSpace(name: string): PDFOperator {
  return op('cs', [PDFName.of(name)]);
}
function setFillingPattern(name: string): PDFOperator {
  return op('scn', [PDFName.of(name)]);
}

function applyMatrix(ctx: DrawCtx, m: Mat): void {
  ctx.page.pushOperators(op('cm', [m[0], m[1], m[2], m[3], m[4], m[5]]));
}

function emitPathOperators(page: PDFPage, d: string): void {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let prevCmd = '';
  let lastCtrl: [number, number] | null = null;
  const ops: PDFOperator[] = [];

  const num = (): number => parseFloat(tokens[i++] as string);

  while (i < tokens.length) {
    let cmd = tokens[i] as string;
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(cmd)) {
      i++;
    } else {
      // Implicit-repeat per SVG spec: M→L, m→l, everything else self-repeats.
      cmd = prevCmd === 'M' ? 'L' : prevCmd === 'm' ? 'l' : prevCmd;
    }
    const rel = cmd >= 'a';
    switch (cmd) {
      case 'M':
      case 'm': {
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        cx = x;
        cy = y;
        sx = x;
        sy = y;
        ops.push(op('m', [x, y]));
        lastCtrl = null;
        break;
      }
      case 'L':
      case 'l': {
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        cx = x;
        cy = y;
        ops.push(op('l', [x, y]));
        lastCtrl = null;
        break;
      }
      case 'H':
      case 'h': {
        const x = num() + (rel ? cx : 0);
        cx = x;
        ops.push(op('l', [x, cy]));
        lastCtrl = null;
        break;
      }
      case 'V':
      case 'v': {
        const y = num() + (rel ? cy : 0);
        cy = y;
        ops.push(op('l', [cx, y]));
        lastCtrl = null;
        break;
      }
      case 'C':
      case 'c': {
        const x1 = num() + (rel ? cx : 0);
        const y1 = num() + (rel ? cy : 0);
        const x2 = num() + (rel ? cx : 0);
        const y2 = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        ops.push(op('c', [x1, y1, x2, y2, x, y]));
        cx = x;
        cy = y;
        lastCtrl = [x2, y2];
        break;
      }
      case 'S':
      case 's': {
        const x2 = num() + (rel ? cx : 0);
        const y2 = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        const x1 = lastCtrl ? 2 * cx - lastCtrl[0] : cx;
        const y1 = lastCtrl ? 2 * cy - lastCtrl[1] : cy;
        ops.push(op('c', [x1, y1, x2, y2, x, y]));
        cx = x;
        cy = y;
        lastCtrl = [x2, y2];
        break;
      }
      case 'Q':
      case 'q': {
        const qx = num() + (rel ? cx : 0);
        const qy = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        const x1 = cx + (2 / 3) * (qx - cx);
        const y1 = cy + (2 / 3) * (qy - cy);
        const x2 = x + (2 / 3) * (qx - x);
        const y2 = y + (2 / 3) * (qy - y);
        ops.push(op('c', [x1, y1, x2, y2, x, y]));
        cx = x;
        cy = y;
        lastCtrl = [qx, qy];
        break;
      }
      case 'T':
      case 't': {
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        // Explicit `: number` dodges TS's "implicit any from self-reference" misfire.
        const qx: number = lastCtrl ? 2 * cx - (lastCtrl[0] ?? 0) : cx;
        const qy: number = lastCtrl ? 2 * cy - (lastCtrl[1] ?? 0) : cy;
        const x1 = cx + (2 / 3) * (qx - cx);
        const y1 = cy + (2 / 3) * (qy - cy);
        const x2 = x + (2 / 3) * (qx - x);
        const y2 = y + (2 / 3) * (qy - y);
        ops.push(op('c', [x1, y1, x2, y2, x, y]));
        cx = x;
        cy = y;
        lastCtrl = [qx, qy];
        break;
      }
      case 'A':
      case 'a': {
        const rx = Math.abs(num());
        const ry = Math.abs(num());
        const xRot = (num() * Math.PI) / 180;
        const largeArc = num() !== 0;
        const sweep = num() !== 0;
        const ex = num() + (rel ? cx : 0);
        const ey = num() + (rel ? cy : 0);
        for (const seg of arcToBezier(cx, cy, ex, ey, rx, ry, xRot, largeArc, sweep)) {
          ops.push(op('c', seg));
        }
        cx = ex;
        cy = ey;
        lastCtrl = null;
        break;
      }
      case 'Z':
      case 'z':
        ops.push(closePath());
        cx = sx;
        cy = sy;
        lastCtrl = null;
        break;
    }
    prevCmd = cmd;
  }
  page.pushOperators(...ops);
}

// Endpoint-parameterization conversion, W3C SVG 1.1 Appendix F.6.5.
function arcToBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  phi: number,
  largeArc: boolean,
  sweep: boolean,
): number[][] {
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [];
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;
  let rxs = rx * rx;
  let rys = ry * ry;
  const x1ps = x1p * x1p;
  const y1ps = y1p * y1p;
  const lambda = x1ps / rxs + y1ps / rys;
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
    rxs = rx * rx;
    rys = ry * ry;
  }
  const sign = largeArc === sweep ? -1 : 1;
  const denom = rxs * y1ps + rys * x1ps;
  const num = rxs * rys - denom;
  const coef = sign * Math.sqrt(Math.max(0, num / denom));
  const cxp = (coef * (rx * y1p)) / ry;
  const cyp = (coef * -(ry * x1p)) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const sgn = ux * vy - uy * vx >= 0 ? 1 : -1;
    const dot = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    return sgn * Math.acos(Math.max(-1, Math.min(1, dot)));
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

  const segs = Math.ceil(Math.abs(dTheta / (Math.PI / 2)));
  const delta = dTheta / segs;
  const t = ((8 / 3) * Math.sin(delta / 4) ** 2) / Math.sin(delta / 2);
  const out: number[][] = [];
  let theta = theta1;
  let curX = x1;
  let curY = y1;
  for (let s = 0; s < segs; s++) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const cosNext = Math.cos(theta + delta);
    const sinNext = Math.sin(theta + delta);
    const c1x = curX + t * (-rx * cosPhi * sinTheta - ry * sinPhi * cosTheta);
    const c1y = curY + t * (-rx * sinPhi * sinTheta + ry * cosPhi * cosTheta);
    const ex = cx + rx * cosPhi * cosNext - ry * sinPhi * sinNext;
    const ey = cy + rx * sinPhi * cosNext + ry * cosPhi * sinNext;
    const c2x = ex - t * (-rx * cosPhi * sinNext - ry * sinPhi * cosNext);
    const c2y = ey - t * (-rx * sinPhi * sinNext + ry * cosPhi * cosNext);
    out.push([c1x, c1y, c2x, c2y, ex, ey]);
    theta += delta;
    curX = ex;
    curY = ey;
  }
  return out;
}

function applyClipPath(ctx: DrawCtx, refId: string): void {
  const clipNode = findById(ctx.defs, refId);
  if (!clipNode || clipNode.tag !== 'clipPath') return;
  for (const child of clipNode.children) {
    const d = shapeToPath(child);
    if (!d) continue;
    emitPathOperators(ctx.page, d);
    // `W`/`W*` set the clip; `n` (endPath) keeps it from also painting.
    const rule = (clipNode.attrs['clip-rule'] ?? 'nonzero') === 'evenodd';
    ctx.page.pushOperators(rule ? clipEvenOdd() : clip(), endPath());
  }
}

function drawShape(ctx: DrawCtx, el: SvgElement, parentTransform: Mat, opacityScale: number): void {
  const d = shapeToPath(el);
  if (!d) return;

  ctx.page.pushOperators(pushGraphicsState());
  // try/finally so `Q` always lands — a malformed gradient/path/clipPath child
  // must not leave the next shape inside this shape's CTM and clip.
  try {
    const transform = multiply(parentTransform, parseTransform(el.attrs.transform));
    const fillRule = (attrOrStyle(el, 'fill-rule') ?? 'nonzero') === 'evenodd';
    const opacity = parseFloat(attrOrStyle(el, 'opacity') ?? '1') || 1;
    const fillOpacity = parseFloat(attrOrStyle(el, 'fill-opacity') ?? '1') || 1;
    const strokeOpacity = parseFloat(attrOrStyle(el, 'stroke-opacity') ?? '1') || 1;
    const fillPaint = resolvePaint(
      attrOrStyle(el, 'fill'),
      { kind: 'rgb', r: 0, g: 0, b: 0, opacity: 1 },
      fillOpacity * opacity * opacityScale,
    );
    const strokePaint = resolvePaint(
      attrOrStyle(el, 'stroke'),
      { kind: 'none' },
      strokeOpacity * opacity * opacityScale,
    );
    const strokeWidth = parseFloat(attrOrStyle(el, 'stroke-width') ?? '1') || 1;
    const clipRefId = parseUrlRef(attrOrStyle(el, 'clip-path'));

    if (!isIdentity(transform)) {
      applyMatrix(ctx, transform);
    }

    if (clipRefId) applyClipPath(ctx, clipRefId);

    if (fillPaint.kind === 'gradient') {
      const bbox = pathBBox(d);
      const built = buildGradientPattern(ctx.page, ctx.defs, fillPaint.id, bbox);
      if (built) {
        const name = ensurePatternResource(ctx, built.patternRef);
        ctx.page.pushOperators(setFillingColorSpace('Pattern'), setFillingPattern(name));
      } else {
        ctx.page.pushOperators(setFillingRgbColor(0, 0, 0));
      }
    } else if (fillPaint.kind === 'rgb') {
      ctx.page.pushOperators(setFillingRgbColor(fillPaint.r, fillPaint.g, fillPaint.b));
    }

    if (strokePaint.kind === 'rgb') {
      ctx.page.pushOperators(
        setStrokingRgbColor(strokePaint.r, strokePaint.g, strokePaint.b),
        setLineWidth(strokeWidth),
      );
    }

    emitPathOperators(ctx.page, d);

    const hasFill = fillPaint.kind !== 'none';
    const hasStroke = strokePaint.kind !== 'none';
    if (hasFill && hasStroke) {
      ctx.page.pushOperators(fillRule ? op('B*') : fillAndStroke());
    } else if (hasStroke) {
      ctx.page.pushOperators(stroke());
    } else if (hasFill) {
      ctx.page.pushOperators(fillRule ? op('f*') : fill());
    } else {
      ctx.page.pushOperators(endPath());
    }
  } catch (err) {
    console.warn('[imprint] drawShape: skipping malformed SVG shape:', err);
  } finally {
    ctx.page.pushOperators(popGraphicsState());
  }
}

function isIdentity(m: Mat): boolean {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
}

const SKIP_TAGS = new Set([
  'defs',
  'linearGradient',
  'radialGradient',
  'mask',
  'filter',
  'clipPath',
]);
const SHAPE_TAGS = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);

function walk(ctx: DrawCtx, el: SvgElement, parent: Mat, opacityScale: number): void {
  if (SKIP_TAGS.has(el.tag)) return;

  if (el.tag === 'g' || el.tag === 'svg') {
    const local = multiply(parent, parseTransform(el.attrs.transform));
    const op = parseFloat(attrOrStyle(el, 'opacity') ?? '1') || 1;
    for (const c of el.children) walk(ctx, c, local, opacityScale * op);
    return;
  }

  if (SHAPE_TAGS.has(el.tag)) {
    drawShape(ctx, el, parent, opacityScale);
  }
}

export interface DrawSvgOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Render an inline SVG into the given PDF box. Returns `false` if `source` isn't
 * a parseable `<svg>` or if a draw error caused the SVG to be skipped. Draw errors
 * are logged but never bubble — one malformed `<path>` shouldn't tank the page.
 */
export function drawSvgString(
  source: string,
  page: PDFPage,
  opts: DrawSvgOptions,
  pageHeight: number,
): boolean {
  const root = parseSvg(source);
  if (!root || root.tag !== 'svg') return false;

  const viewBox =
    parseViewBox(root.attrs.viewBox) ??
    ({
      x: 0,
      y: 0,
      w: parseFloat(root.attrs.width ?? `${opts.width}`) || opts.width,
      h: parseFloat(root.attrs.height ?? `${opts.height}`) || opts.height,
    } as ViewBox);

  // Zero-width/height viewBox produces a NaN/Infinity scale matrix.
  if (!(viewBox.w > 0) || !(viewBox.h > 0)) return false;

  const sx = opts.width / viewBox.w;
  const sy = opts.height / viewBox.h;

  // SVG is y-down, PDF y-up — negative y-scale + offset flips it.
  const pdfTop = pageHeight - opts.y;

  page.pushOperators(pushGraphicsState());
  try {
    page.pushOperators(op('cm', [sx, 0, 0, -sy, opts.x - viewBox.x * sx, pdfTop + viewBox.y * sy]));

    const ctx: DrawCtx = {
      page,
      defs: root,
      patternCounter: { n: 0 },
      patternNames: new Map(),
    };

    // drawShape self-balances its q/Q in try/finally, so one bad shape doesn't
    // poison the rest.
    walk(ctx, root, IDENTITY, 1);
    return true;
  } catch (err) {
    // Last-resort guard — a future regression shouldn't quietly empty the page.
    console.warn('[imprint] drawSvgString: skipping SVG due to draw error:', err);
    return false;
  } finally {
    page.pushOperators(popGraphicsState());
  }
}
