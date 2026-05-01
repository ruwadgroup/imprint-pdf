import { describe, expect, it } from 'vitest';
import {
  clearSvgRasterizer,
  getSvgRasterizer,
  needsRasterization,
  setSvgRasterizer,
} from './rasterize-slot.js';

describe('needsRasterization', () => {
  it('flags filter elements', () => {
    expect(needsRasterization('<svg><filter id="f"/></svg>')).toBe(true);
  });
  it('flags mask elements', () => {
    expect(needsRasterization('<svg><mask id="m"></mask></svg>')).toBe(true);
  });
  it('flags foreignObject', () => {
    expect(needsRasterization('<svg><foreignObject><div/></foreignObject></svg>')).toBe(true);
  });
  it('passes plain SVG through', () => {
    expect(needsRasterization('<svg><rect/></svg>')).toBe(false);
  });
  it('does not match `clipPath` (substring) or `linearGradient`', () => {
    expect(needsRasterization('<svg><clipPath/></svg>')).toBe(false);
    expect(needsRasterization('<svg><linearGradient/></svg>')).toBe(false);
  });
});

describe('rasterizer slot', () => {
  it('round-trips set/get/clear', async () => {
    const fake = async () => new Uint8Array([1, 2, 3]);
    setSvgRasterizer(fake);
    expect(getSvgRasterizer()).toBe(fake);
    clearSvgRasterizer();
    expect(getSvgRasterizer()).toBe(null);
  });
});
