import type { Color } from 'pdf-lib';
import { cmyk, grayscale, rgb } from 'pdf-lib';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, '');
  const expanded =
    clean.length === 3
      ? clean[0]! + clean[0]! + clean[1]! + clean[1]! + clean[2]! + clean[2]!
      : clean;
  return {
    r: parseInt(expanded.slice(0, 2), 16) / 255,
    g: parseInt(expanded.slice(2, 4), 16) / 255,
    b: parseInt(expanded.slice(4, 6), 16) / 255,
  };
}

// OKLCH → sRGB via Oklab. Constants from https://bottosson.github.io/posts/oklab/.
// Out-of-gamut channels clamp.
function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bOklab = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bOklab;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bOklab;
  const s_ = l - 0.0894841775 * a - 1.291485548 * bOklab;
  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;
  const toSrgb = (x: number) => {
    const n = Math.max(0, Math.min(1, x));
    return n <= 0.0031308 ? 12.92 * n : 1.055 * n ** (1 / 2.4) - 0.055;
  };
  return {
    r: toSrgb(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc),
    g: toSrgb(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc),
    b: toSrgb(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return { r: r + m, g: g + m, b: b + m };
}

export function parseColor(colorStr: string | undefined): Color | undefined {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'none') return undefined;

  if (colorStr === 'white' || colorStr === '#fff' || colorStr === '#ffffff') return rgb(1, 1, 1);
  if (colorStr === 'black' || colorStr === '#000' || colorStr === '#000000') return rgb(0, 0, 0);

  if (colorStr.startsWith('#')) {
    const { r, g, b } = hexToRgb(colorStr);
    return rgb(r, g, b);
  }

  const rgba = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgba) {
    return rgb(
      parseInt(rgba[1] ?? '0', 10) / 255,
      parseInt(rgba[2] ?? '0', 10) / 255,
      parseInt(rgba[3] ?? '0', 10) / 255,
    );
  }

  const hsl = colorStr.match(
    /hsla?\(\s*(\d*\.?\d+)\s*[,\s]\s*(\d*\.?\d+)%?\s*[,\s]\s*(\d*\.?\d+)%/,
  );
  if (hsl) {
    const { r, g, b } = hslToRgb(parseFloat(hsl[1]!), parseFloat(hsl[2]!), parseFloat(hsl[3]!));
    return rgb(r, g, b);
  }

  const oklch = colorStr.match(/oklch\(\s*(\d*\.?\d+)%\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s*\)/);
  if (oklch) {
    const { r, g, b } = oklchToRgb(
      parseFloat(oklch[1]!) / 100,
      parseFloat(oklch[2]!),
      parseFloat(oklch[3]!),
    );
    return rgb(r, g, b);
  }

  // CSS Color 4 device-cmyk(): fractional and percent forms can interleave.
  const deviceCmyk = colorStr.match(
    /device-cmyk\(\s*(\d*\.?\d+)(%?)\s+(\d*\.?\d+)(%?)\s+(\d*\.?\d+)(%?)\s+(\d*\.?\d+)(%?)\s*\)/,
  );
  if (deviceCmyk) {
    const scale = (v: string, isPct: string) => (isPct ? parseFloat(v) / 100 : parseFloat(v));
    return cmyk(
      scale(deviceCmyk[1]!, deviceCmyk[2]!),
      scale(deviceCmyk[3]!, deviceCmyk[4]!),
      scale(deviceCmyk[5]!, deviceCmyk[6]!),
      scale(deviceCmyk[7]!, deviceCmyk[8]!),
    );
  }

  // Print-pipeline `cmyk()` is 0–100; CSS `device-cmyk()` above is 0–1.
  const cmykFn = colorStr.match(
    /cmyk\(\s*(\d*\.?\d+)%?\s*,\s*(\d*\.?\d+)%?\s*,\s*(\d*\.?\d+)%?\s*,\s*(\d*\.?\d+)%?\s*\)/,
  );
  if (cmykFn) {
    return cmyk(
      parseFloat(cmykFn[1]!) / 100,
      parseFloat(cmykFn[2]!) / 100,
      parseFloat(cmykFn[3]!) / 100,
      parseFloat(cmykFn[4]!) / 100,
    );
  }

  const gray = colorStr.match(/gr(?:ay|ayscale)\(\s*(\d*\.?\d+)%?\s*\)/);
  if (gray) {
    const v = parseFloat(gray[1]!);
    // Accept both `gray(50%)` and `gray(0.5)`.
    return grayscale(v > 1 ? v / 100 : v);
  }

  return undefined;
}

export function toPt(value: string | number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value === 'number') return value;
  const n = parseFloat(value);
  if (value.endsWith('px')) return n * 0.75;
  if (value.endsWith('pt')) return n;
  if (value.endsWith('mm')) return n * 2.8346;
  if (value.endsWith('cm')) return n * 28.346;
  if (value.endsWith('in')) return n * 72;
  return Number.isNaN(n) ? fallback : n;
}
