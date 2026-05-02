/**
 * CMYK color values, channels in 0–100 (percent ink).
 *
 * Imprint uses percent rather than 0–1 because every print spec, swatch book,
 * and prepress operator quotes CMYK in percent. The PDF writer divides by 100
 * before emitting `c m y k k` operators.
 */
export interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

/**
 * Naive sRGB → CMYK using `K = 1 − max(R,G,B)`. No ICC color management — the
 * result is a screen-preview approximation only. For press-accurate conversion
 * use `convertWithIcc` (lcms2 WASM) once an output ICC profile is loaded.
 */
export function rgbToCmyk(hex: string): CmykColor {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  const v = parseInt(m[1]!, 16);
  const r = ((v >> 16) & 0xff) / 255;
  const g = ((v >> 8) & 0xff) / 255;
  const b = (v & 0xff) / 255;

  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };

  const denom = 1 - k;
  return {
    c: Math.round(((1 - r - k) / denom) * 100),
    m: Math.round(((1 - g - k) / denom) * 100),
    y: Math.round(((1 - b - k) / denom) * 100),
    k: Math.round(k * 100),
  };
}

/**
 * Parses the value portion of an `imprint:cmyk-[c,m,y,k]` Tailwind class,
 * e.g. `"0,100,100,0"` → cyan/magenta/yellow/key in percent.
 */
export function parseCmykClass(value: string): CmykColor | null {
  const parts = value.split(',');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number.parseFloat(p.trim()));
  if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return null;
  return { c: nums[0]!, m: nums[1]!, y: nums[2]!, k: nums[3]! };
}

/** Renders a CMYK colour as the PDF `c m y k K` operator. */
export function cmykOperator(color: CmykColor): string {
  const c = (color.c / 100).toFixed(4);
  const m = (color.m / 100).toFixed(4);
  const y = (color.y / 100).toFixed(4);
  const k = (color.k / 100).toFixed(4);
  return `${c} ${m} ${y} ${k} K`;
}
