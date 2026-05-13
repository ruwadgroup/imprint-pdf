import type { PDFDict, PDFPage, PDFRef } from 'pdf-lib';
import { PDFArray, PDFName, PDFNumber } from 'pdf-lib';
import { parseColor } from '../color.js';
import { findById, type SvgElement } from './parser.js';
import { type Mat, multiply, parseTransform } from './transform.js';

export interface GradientStop {
  offset: number;
  color: [number, number, number];
  opacity: number;
}

function colorToRgb(colorStr: string): [number, number, number] {
  const c = parseColor(colorStr);
  if (!c) return [0, 0, 0];
  const any = c as { type: string; red?: number; green?: number; blue?: number; gray?: number };
  if (any.type === 'RGB') return [any.red ?? 0, any.green ?? 0, any.blue ?? 0];
  if (any.type === 'Grayscale') {
    const g = any.gray ?? 0;
    return [g, g, g];
  }
  return [0, 0, 0];
}

function parseStops(el: SvgElement): GradientStop[] {
  const stops: GradientStop[] = [];
  for (const child of el.children) {
    if (child.tag !== 'stop') continue;
    const offsetRaw = child.attrs.offset ?? '0';
    const offset = offsetRaw.endsWith('%')
      ? parseFloat(offsetRaw) / 100
      : Math.max(0, Math.min(1, parseFloat(offsetRaw) || 0));
    const styleAttr = child.attrs.style ?? '';
    const styleColor = /stop-color\s*:\s*([^;]+)/.exec(styleAttr)?.[1]?.trim();
    const styleOpacity = /stop-opacity\s*:\s*([^;]+)/.exec(styleAttr)?.[1]?.trim();
    const colorStr = (child.attrs['stop-color'] ?? styleColor ?? 'black').trim();
    const opacityStr = child.attrs['stop-opacity'] ?? styleOpacity ?? '1';
    stops.push({
      offset,
      color: colorToRgb(colorStr),
      opacity: parseFloat(opacityStr) || 1,
    });
  }
  stops.sort((a, b) => a.offset - b.offset);
  return stops;
}

function buildShadingFunction(page: PDFPage, stops: GradientStop[]): PDFRef {
  const ctx = page.doc.context;
  if (stops.length === 0) {
    const f = ctx.obj({
      FunctionType: 2,
      Domain: [0, 1],
      C0: [0, 0, 0],
      C1: [0, 0, 0],
      N: 1,
    });
    return ctx.register(f);
  }
  if (stops.length === 1) {
    const c = stops[0]!.color;
    const f = ctx.obj({ FunctionType: 2, Domain: [0, 1], C0: c, C1: c, N: 1 });
    return ctx.register(f);
  }
  if (stops.length === 2) {
    const f = ctx.obj({
      FunctionType: 2,
      Domain: [0, 1],
      C0: stops[0]!.color,
      C1: stops[1]!.color,
      N: 1,
    });
    return ctx.register(f);
  }
  const fns: PDFRef[] = [];
  const bounds: number[] = [];
  const encode: number[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    const f = ctx.obj({
      FunctionType: 2,
      Domain: [0, 1],
      C0: a.color,
      C1: b.color,
      N: 1,
    });
    fns.push(ctx.register(f));
    // Type 3 `Bounds` must be strictly monotonic — nudge coincident stops.
    if (i > 0) bounds.push(b.offset === a.offset ? a.offset + 1e-6 : b.offset);
    encode.push(0, 1);
  }
  const fnsArr = PDFArray.withContext(ctx);
  for (const r of fns) fnsArr.push(r);
  const stitching = ctx.obj({
    FunctionType: 3,
    Domain: [0, 1],
    Bounds: bounds,
    Encode: encode,
  });
  (stitching as PDFDict).set(PDFName.of('Functions'), fnsArr);
  return ctx.register(stitching);
}

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function resolveCoord(value: string | undefined, base: number, fallback: number): number {
  if (value === undefined) return fallback;
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) return (parseFloat(trimmed) / 100) * base;
  return parseFloat(trimmed) || 0;
}

interface Built {
  patternRef: PDFRef;
  alphaRef: PDFRef | null;
}

function unitsToShape(
  bbox: BBox,
  units: 'userSpaceOnUse' | 'objectBoundingBox',
  ...vals: (string | undefined)[]
): number[] {
  if (units === 'userSpaceOnUse') {
    return vals.map((v, i) => resolveCoord(v, i % 2 === 0 ? bbox.w : bbox.h, 0));
  }
  return vals.map((v) => {
    if (v === undefined) return 0;
    const t = v.trim();
    if (t.endsWith('%')) return parseFloat(t) / 100;
    return parseFloat(t) || 0;
  });
}

/**
 * Build a Type-2 Pattern dict for `fill="url(#id)"`. Returns the Pattern ref plus
 * an optional alpha-shading ref for stop opacities (only present when a stop has alpha < 1).
 */
export function buildGradientPattern(
  page: PDFPage,
  defs: SvgElement,
  id: string,
  bbox: BBox,
): Built | null {
  const node = findById(defs, id);
  if (!node) return null;

  const stops = parseStops(node);
  if (stops.length === 0) return null;

  const units =
    node.attrs.gradientUnits === 'userSpaceOnUse' ? 'userSpaceOnUse' : 'objectBoundingBox';
  const gradientTransform = parseTransform(node.attrs.gradientTransform);

  const unitMatrix: Mat =
    units === 'objectBoundingBox' ? [bbox.w, 0, 0, bbox.h, bbox.x, bbox.y] : [1, 0, 0, 1, 0, 0];
  const matrix = multiply(unitMatrix, gradientTransform);

  const fn = buildShadingFunction(page, stops);
  const ctx = page.doc.context;

  let shading: PDFDict;
  if (node.tag === 'linearGradient') {
    const [x1, y1, x2, y2] = unitsToShape(
      bbox,
      units,
      node.attrs.x1 ?? '0',
      node.attrs.y1 ?? '0',
      node.attrs.x2 ?? (units === 'objectBoundingBox' ? '1' : `${bbox.w}`),
      node.attrs.y2 ?? '0',
    ) as [number, number, number, number];
    shading = ctx.obj({
      ShadingType: 2,
      ColorSpace: 'DeviceRGB',
      Coords: [x1, y1, x2, y2],
      Domain: [0, 1],
      Extend: [true, true],
    }) as PDFDict;
    shading.set(PDFName.of('Function'), fn);
  } else if (node.tag === 'radialGradient') {
    const cx = resolveCoord(node.attrs.cx, units === 'objectBoundingBox' ? 1 : bbox.w, 0.5);
    const cy = resolveCoord(node.attrs.cy, units === 'objectBoundingBox' ? 1 : bbox.h, 0.5);
    const r = resolveCoord(
      node.attrs.r,
      units === 'objectBoundingBox' ? 1 : Math.max(bbox.w, bbox.h),
      0.5,
    );
    const fx = resolveCoord(node.attrs.fx, units === 'objectBoundingBox' ? 1 : bbox.w, cx);
    const fy = resolveCoord(node.attrs.fy, units === 'objectBoundingBox' ? 1 : bbox.h, cy);
    shading = ctx.obj({
      ShadingType: 3,
      ColorSpace: 'DeviceRGB',
      Coords: [fx, fy, 0, cx, cy, r],
      Domain: [0, 1],
      Extend: [true, true],
    }) as PDFDict;
    shading.set(PDFName.of('Function'), fn);
  } else {
    return null;
  }

  const shadingRef = ctx.register(shading);

  const matrixArr = PDFArray.withContext(ctx);
  for (const v of matrix) matrixArr.push(PDFNumber.of(v));

  const pattern = ctx.obj({
    Type: 'Pattern',
    PatternType: 2,
  }) as PDFDict;
  pattern.set(PDFName.of('Shading'), shadingRef);
  pattern.set(PDFName.of('Matrix'), matrixArr);

  const patternRef = ctx.register(pattern);

  let alphaRef: PDFRef | null = null;
  if (stops.some((s) => s.opacity < 1)) {
    const alphaStops = stops.map((s) => ({
      offset: s.offset,
      color: [s.opacity, s.opacity, s.opacity] as [number, number, number],
      opacity: 1,
    }));
    const alphaFn = buildShadingFunction(page, alphaStops);
    const alphaShading = ctx.obj({
      ShadingType: shading.get(PDFName.of('ShadingType')),
      ColorSpace: 'DeviceGray',
      Coords: shading.get(PDFName.of('Coords')),
      Domain: [0, 1],
      Extend: [true, true],
    }) as PDFDict;
    alphaShading.set(PDFName.of('Function'), alphaFn);
    alphaRef = ctx.register(alphaShading);
  }

  return { patternRef, alphaRef };
}
