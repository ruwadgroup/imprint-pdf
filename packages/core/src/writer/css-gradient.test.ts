import { describe, expect, it } from 'vitest';
import { parseCssGradient } from './css-gradient.js';

describe('parseCssGradient', () => {
  it('parses a two-stop linear gradient with a keyword direction', () => {
    const g = parseCssGradient('linear-gradient(to right,#ff0000,#0000ff)');
    expect(g?.kind).toBe('linear');
    expect(g?.angle).toBe(90);
    expect(g?.stops).toHaveLength(2);
    expect(g?.stops[0]?.color).toEqual([1, 0, 0]);
    expect(g?.stops[1]?.color).toEqual([0, 0, 1]);
  });

  it('parses an angle and three evenly-spread stops', () => {
    const g = parseCssGradient('linear-gradient(135deg,#000,#888,#fff)');
    expect(g?.angle).toBe(135);
    expect(g?.stops).toHaveLength(3);
    expect(g?.stops[1]?.offset).toBeCloseTo(0.5);
  });

  it('honours explicit stop positions', () => {
    const g = parseCssGradient('linear-gradient(to bottom,#000 10%,#fff 80%)');
    expect(g?.stops[0]?.offset).toBeCloseTo(0.1);
    expect(g?.stops[1]?.offset).toBeCloseTo(0.8);
  });

  it('strips a Tailwind oklab interpolation hint', () => {
    const g = parseCssGradient('linear-gradient(to right in oklab,#000,#fff)');
    expect(g?.angle).toBe(90);
    expect(g?.stops).toHaveLength(2);
  });

  it('parses a radial gradient, dropping the shape clause', () => {
    const g = parseCssGradient('radial-gradient(circle,#a855f7,#1e293b)');
    expect(g?.kind).toBe('radial');
    expect(g?.stops).toHaveLength(2);
  });

  it('keeps commas inside color functions intact', () => {
    const g = parseCssGradient('linear-gradient(to right,rgb(255,0,0),rgb(0,0,255))');
    expect(g?.stops).toHaveLength(2);
    expect(g?.stops[0]?.color).toEqual([1, 0, 0]);
  });

  it('returns null for non-gradient values', () => {
    expect(parseCssGradient('url(foo.png)')).toBeNull();
    expect(parseCssGradient('none')).toBeNull();
  });
});
