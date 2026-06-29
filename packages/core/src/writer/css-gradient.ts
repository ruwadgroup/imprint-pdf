import type { PDFDict, PDFPage, PDFRef } from 'pdf-lib';
import {
  clip,
  endPath,
  PDFName,
  PDFOperator,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
} from 'pdf-lib';
import { parseColor } from './color.js';
import { buildShadingFunction, type GradientStop } from './svg/gradients.js';

export interface ParsedGradient {
  kind: 'linear' | 'radial';
  /** CSS angle in degrees (linear only). 0 = to top, 90 = to right. */
  angle: number;
  stops: GradientStop[];
}

/** A rectangle in PDF page coordinates (y up). */
export interface GradientBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SIDE_ANGLES: Record<string, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
  'top right': 45,
  'right top': 45,
  'bottom right': 135,
  'right bottom': 135,
  'bottom left': 225,
  'left bottom': 225,
  'top left': 315,
  'left top': 315,
};

function rgb01(colorStr: string): [number, number, number] {
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

/** Split on top-level commas, ignoring commas nested inside `(...)`. */
function splitTopLevel(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(input.slice(start).trim());
  return out;
}

function parseStops(parts: string[]): GradientStop[] {
  // Each part is `<color> [<position%>]`. Colors may contain spaces only inside
  // function parens (rgb(...)/oklch(...)), which splitTopLevel kept intact, so
  // the last whitespace-separated token that ends in `%` is the position.
  const raw = parts.map((p) => {
    const posMatch = /\s+(-?[\d.]+)%\s*$/.exec(p);
    if (posMatch) {
      return { color: p.slice(0, posMatch.index).trim(), offset: parseFloat(posMatch[1]!) / 100 };
    }
    return { color: p.trim(), offset: null as number | null };
  });
  // Fill in missing offsets: ends default to 0 and 1, interior spread evenly.
  if (raw.length > 0) {
    if (raw[0]!.offset === null) raw[0]!.offset = 0;
    if (raw[raw.length - 1]!.offset === null) raw[raw.length - 1]!.offset = 1;
  }
  for (let i = 1; i < raw.length - 1; i++) {
    if (raw[i]!.offset !== null) continue;
    // Spread a run of position-less stops evenly between the nearest anchored
    // neighbours (CSS gradient stop interpolation).
    const prevIdx = i - 1;
    let nextIdx = i + 1;
    while (nextIdx < raw.length && raw[nextIdx]!.offset === null) nextIdx++;
    const prev = raw[prevIdx]!.offset ?? 0;
    const nextOffset = raw[nextIdx]!.offset ?? 1;
    raw[i]!.offset = prev + ((nextOffset - prev) * (i - prevIdx)) / (nextIdx - prevIdx);
  }
  return raw.map((s) => ({
    offset: Math.max(0, Math.min(1, s.offset ?? 0)),
    color: rgb01(s.color),
    opacity: 1,
  }));
}

/**
 * Parse a CSS `linear-gradient(...)` / `radial-gradient(...)` value. Returns
 * null for anything else (e.g. `url(...)`, conic-gradient, unparseable input).
 * The Tailwind from/via/to utility sugar (which hides stops behind
 * `--tw-gradient-*` custom properties and oklab interpolation) is not handled
 * here - this covers raw/arbitrary gradient values.
 */
export function parseCssGradient(value: string): ParsedGradient | null {
  const trimmed = value.trim();
  const linear = /^(?:repeating-)?linear-gradient\((.*)\)$/s.exec(trimmed);
  const radial = /^(?:repeating-)?radial-gradient\((.*)\)$/s.exec(trimmed);
  const inner = (linear ?? radial)?.[1];
  if (inner === undefined) return null;

  let parts = splitTopLevel(inner);
  if (parts.length === 0) return null;

  let angle = 180; // CSS default for linear is `to bottom`.
  const head = parts[0]!.replace(/\s+in\s+(oklab|oklch|srgb|hsl|lab|lch)\b/i, '').trim();

  if (linear) {
    const deg = /^(-?[\d.]+)deg$/.exec(head);
    const toSide = /^to\s+(.+)$/.exec(head);
    if (deg) {
      angle = parseFloat(deg[1]!);
      parts = parts.slice(1);
    } else if (toSide) {
      angle = SIDE_ANGLES[toSide[1]!.trim()] ?? 180;
      parts = parts.slice(1);
    } else if (/in\s+(oklab|oklch|srgb|hsl|lab|lch)/i.test(parts[0]!) && !/[#\d]/.test(head)) {
      // Bare interpolation hint with no angle (Tailwind `to right in oklab`
      // already matched above; this catches a lone `in oklab`).
      parts = parts.slice(1);
    }
  } else {
    // radial: drop a leading shape/size/position clause if it isn't a color.
    if (
      !/^(#|rgb|hsl|oklch|oklab|[a-z]+\s*$)/i.test(head) ||
      /\bat\b|circle|ellipse|closest|farthest/i.test(head)
    ) {
      if (/\bat\b|circle|ellipse|closest|farthest|%/.test(head)) parts = parts.slice(1);
    }
  }

  const stops = parseStops(parts);
  if (stops.length < 2) return null;
  return { kind: linear ? 'linear' : 'radial', angle, stops };
}

function op(name: string, args: unknown[] = []): PDFOperator {
  return PDFOperator.of(name as never, args as never[]);
}

function ensureShadingResource(page: PDFPage, ref: PDFRef): string {
  const ctx = page.doc.context;
  const node = (page as unknown as { node: PDFDict }).node;
  let resources = node.lookup(PDFName.of('Resources')) as PDFDict | undefined;
  if (!resources) {
    resources = ctx.obj({}) as PDFDict;
    node.set(PDFName.of('Resources'), resources);
  }
  let shadings = resources.lookup(PDFName.of('Shading')) as PDFDict | undefined;
  if (!shadings) {
    shadings = ctx.obj({}) as PDFDict;
    resources.set(PDFName.of('Shading'), shadings);
  }
  // A fresh unique name per call is fine; shadings are small and not deduped.
  const existing = shadings.keys().length;
  const name = `ImGr${existing}`;
  shadings.set(PDFName.of(name), ref);
  return name;
}

/**
 * Paint a parsed CSS gradient as the background of `box` (PDF page coords),
 * clipped to that rectangle. Uses the PDF `sh` shading operator inside a saved
 * graphics state so it never leaks outside the element.
 */
export function paintCssGradient(page: PDFPage, g: ParsedGradient, box: GradientBox): void {
  const ctx = page.doc.context;
  const fn = buildShadingFunction(page, g.stops);

  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;

  let shading: PDFDict;
  if (g.kind === 'linear') {
    const rad = (g.angle * Math.PI) / 180;
    // PDF y-up: 0deg -> +y (top), 90deg -> +x (right).
    const dx = Math.sin(rad);
    const dy = Math.cos(rad);
    const len = Math.abs(box.w * dx) + Math.abs(box.h * dy);
    const x1 = cx - (dx * len) / 2;
    const y1 = cy - (dy * len) / 2;
    const x2 = cx + (dx * len) / 2;
    const y2 = cy + (dy * len) / 2;
    shading = ctx.obj({
      ShadingType: 2,
      ColorSpace: 'DeviceRGB',
      Coords: [x1, y1, x2, y2],
      Domain: [0, 1],
      Extend: [true, true],
    }) as PDFDict;
  } else {
    const r = Math.sqrt((box.w / 2) ** 2 + (box.h / 2) ** 2); // farthest-corner
    shading = ctx.obj({
      ShadingType: 3,
      ColorSpace: 'DeviceRGB',
      Coords: [cx, cy, 0, cx, cy, r],
      Domain: [0, 1],
      Extend: [true, true],
    }) as PDFDict;
  }
  shading.set(PDFName.of('Function'), fn);
  const name = ensureShadingResource(page, ctx.register(shading));

  page.pushOperators(
    pushGraphicsState(),
    // Clip to the element rectangle, then paint the shading across the clip.
    rectangle(box.x, box.y, box.w, box.h),
    clip(),
    endPath(),
    op('sh', [PDFName.of(name)]),
    popGraphicsState(),
  );
}
