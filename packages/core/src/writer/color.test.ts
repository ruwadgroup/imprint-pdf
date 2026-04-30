import { ColorTypes } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { parseColor, toPt } from './color.js';

// Type-safe helpers so tests don't access fields on the wrong color type
function asRgb(c: NonNullable<ReturnType<typeof parseColor>>) {
  expect(c.type).toBe(ColorTypes.RGB);
  return c as { type: typeof ColorTypes.RGB; red: number; green: number; blue: number };
}

describe('parseColor', () => {
  it('returns undefined for falsy input', () => {
    expect(parseColor(undefined)).toBeUndefined();
    expect(parseColor('')).toBeUndefined();
    expect(parseColor('transparent')).toBeUndefined();
    expect(parseColor('none')).toBeUndefined();
  });

  it('parses named white/black', () => {
    const white = asRgb(parseColor('white')!);
    expect(white.red).toBeCloseTo(1);
    expect(white.green).toBeCloseTo(1);
    expect(white.blue).toBeCloseTo(1);

    const black = asRgb(parseColor('black')!);
    expect(black.red).toBeCloseTo(0);
    expect(black.green).toBeCloseTo(0);
    expect(black.blue).toBeCloseTo(0);
  });

  it('parses 3-digit hex', () => {
    expect(asRgb(parseColor('#fff')!).red).toBeCloseTo(1);
  });

  it('parses 6-digit hex', () => {
    const c = asRgb(parseColor('#ff0000')!);
    expect(c.red).toBeCloseTo(1);
    expect(c.green).toBeCloseTo(0);
    expect(c.blue).toBeCloseTo(0);
  });

  it('parses rgb()', () => {
    const c = asRgb(parseColor('rgb(0, 128, 255)')!);
    expect(c.red).toBeCloseTo(0);
    expect(c.green).toBeCloseTo(128 / 255, 2);
    expect(c.blue).toBeCloseTo(1);
  });

  it('parses rgba()', () => {
    const c = asRgb(parseColor('rgba(255, 0, 0, 0.5)')!);
    expect(c.red).toBeCloseTo(1);
    expect(c.green).toBeCloseTo(0);
  });

  it('parses hsl()', () => {
    // Red: hsl(0, 100%, 50%)
    const red = asRgb(parseColor('hsl(0, 100%, 50%)')!);
    expect(red.red).toBeCloseTo(1);
    expect(red.green).toBeCloseTo(0);
    expect(red.blue).toBeCloseTo(0);

    // Green: hsl(120, 100%, 50%)
    const green = asRgb(parseColor('hsl(120, 100%, 50%)')!);
    expect(green.green).toBeCloseTo(1);
    expect(green.red).toBeCloseTo(0);

    // White: hsl(0, 0%, 100%)
    const white = asRgb(parseColor('hsl(0, 0%, 100%)')!);
    expect(white.red).toBeCloseTo(1);
    expect(white.green).toBeCloseTo(1);
    expect(white.blue).toBeCloseTo(1);
  });

  it('parses oklch() colors', () => {
    const white = asRgb(parseColor('oklch(100% 0 0)')!);
    expect(white.red).toBeGreaterThan(0.9);

    const black = asRgb(parseColor('oklch(0% 0 0)')!);
    expect(black.red).toBeCloseTo(0, 1);

    const gray900 = asRgb(parseColor('oklch(21% 0.034 264.665)')!);
    expect(gray900.red).toBeLessThan(0.2);
  });

  it('parses cmyk() — 0–100 print scale', () => {
    const red = parseColor('cmyk(0, 100, 100, 0)')!;
    expect(red.type).toBe(ColorTypes.CMYK);
    const c = red as {
      type: typeof ColorTypes.CMYK;
      cyan: number;
      magenta: number;
      yellow: number;
      key: number;
    };
    expect(c.cyan).toBeCloseTo(0);
    expect(c.magenta).toBeCloseTo(1);
    expect(c.yellow).toBeCloseTo(1);
    expect(c.key).toBeCloseTo(0);
  });

  it('parses device-cmyk() — CSS Color 4 scale', () => {
    const c = parseColor('device-cmyk(0 1 1 0)')!;
    expect(c.type).toBe(ColorTypes.CMYK);
  });

  it('parses device-cmyk() with percentages', () => {
    const c = parseColor('device-cmyk(0% 100% 100% 0%)')!;
    expect(c.type).toBe(ColorTypes.CMYK);
  });

  it('parses grayscale()', () => {
    const g = parseColor('grayscale(50%)')!;
    expect(g.type).toBe(ColorTypes.Grayscale);
    const gs = g as { type: typeof ColorTypes.Grayscale; gray: number };
    expect(gs.gray).toBeCloseTo(0.5);
  });

  it('parses gray()', () => {
    const g = parseColor('gray(0.25)')!;
    expect(g.type).toBe(ColorTypes.Grayscale);
  });

  it('returns undefined for unrecognised format', () => {
    expect(parseColor('currentColor')).toBeUndefined();
  });
});

describe('toPt', () => {
  it('returns fallback for undefined', () => {
    expect(toPt(undefined, 42)).toBe(42);
  });

  it('converts px to pt', () => {
    expect(toPt('12px', 0)).toBeCloseTo(9);
  });

  it('passes through pt values', () => {
    expect(toPt('10pt', 0)).toBe(10);
  });

  it('converts mm to pt', () => {
    expect(toPt('10mm', 0)).toBeCloseTo(28.346, 1);
  });

  it('converts cm to pt', () => {
    expect(toPt('1cm', 0)).toBeCloseTo(28.346, 1);
  });

  it('converts in to pt', () => {
    expect(toPt('1in', 0)).toBeCloseTo(72);
  });

  it('parses bare number strings', () => {
    expect(toPt('16', 0)).toBe(16);
  });

  it('handles numeric input directly', () => {
    expect(toPt(20, 0)).toBe(20);
  });
});
