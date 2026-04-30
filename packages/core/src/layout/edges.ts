import type { ResolvedStyle } from '../types.js';
import { resolvePt } from './units.js';

export interface Edges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function resolveEdges(
  style: ResolvedStyle,
  prop: 'padding' | 'margin',
  containerW: number,
): Edges {
  const shorthand = style[prop];
  let top = 0,
    right = 0,
    bottom = 0,
    left = 0;
  if (shorthand !== undefined && shorthand !== '') {
    const v = resolvePt(shorthand, containerW);
    top = right = bottom = left = v;
  }
  const tKey = `${prop}Top` as keyof ResolvedStyle;
  const rKey = `${prop}Right` as keyof ResolvedStyle;
  const bKey = `${prop}Bottom` as keyof ResolvedStyle;
  const lKey = `${prop}Left` as keyof ResolvedStyle;
  if (style[tKey] !== undefined) top = resolvePt(style[tKey] as string | number, containerW);
  if (style[rKey] !== undefined) right = resolvePt(style[rKey] as string | number, containerW);
  if (style[bKey] !== undefined) bottom = resolvePt(style[bKey] as string | number, containerW);
  if (style[lKey] !== undefined) left = resolvePt(style[lKey] as string | number, containerW);
  return { top, right, bottom, left };
}
