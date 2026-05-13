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
  const base = shorthand !== undefined && shorthand !== '' ? resolvePt(shorthand, containerW) : 0;
  const side = (key: keyof ResolvedStyle): number => {
    const v = style[key];
    return v !== undefined ? resolvePt(v as string | number, containerW) : base;
  };
  return {
    top: side(`${prop}Top` as keyof ResolvedStyle),
    right: side(`${prop}Right` as keyof ResolvedStyle),
    bottom: side(`${prop}Bottom` as keyof ResolvedStyle),
    left: side(`${prop}Left` as keyof ResolvedStyle),
  };
}
