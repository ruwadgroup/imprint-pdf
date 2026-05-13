import type { SvgRasterizer } from '../../types.js';

let _rasterizer: SvgRasterizer | null = null;

export function setSvgRasterizer(rasterizer: SvgRasterizer | null | undefined): void {
  _rasterizer = rasterizer ?? null;
}

export function getSvgRasterizer(): SvgRasterizer | null {
  return _rasterizer;
}

export function clearSvgRasterizer(): void {
  _rasterizer = null;
}

// Elements that demand pixel ops PDF can't express natively — force raster fallback.
const RASTER_REQUIRED = /<\s*(filter|mask|foreignObject)[\s>]/i;

export function needsRasterization(svg: string): boolean {
  return RASTER_REQUIRED.test(svg);
}
