const MM_PER_PT = 1 / 2.8346472;

/** Symmetric four-sided bleed measured in PDF points (1/72 inch). */
export interface BleedBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Parses a CSS-style bleed declaration into points.
 *
 * Accepts the same 1 / 2 / 4 value shorthand as CSS `padding`. Supported
 * units: `mm` (default), `cm`, `in`, `pt`. Invalid input falls back to 3 mm,
 * which is the press default for ISO A series.
 *
 * @example parseBleed('3mm')          // { top: 8.5, right: 8.5, bottom: 8.5, left: 8.5 }
 * @example parseBleed('3mm 6mm')      // top/bottom 8.5pt, right/left 17pt
 * @example parseBleed('0.125in')      // 9pt
 */
export function parseBleed(input: string): BleedBox {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return uniform(parsePoints('3mm'));

  if (parts.length === 1) return uniform(parsePoints(parts[0]!));

  if (parts.length === 2) {
    const tb = parsePoints(parts[0]!);
    const rl = parsePoints(parts[1]!);
    return { top: tb, right: rl, bottom: tb, left: rl };
  }

  const [t, r, b, l] = parts;
  return {
    top: parsePoints(t ?? '3mm'),
    right: parsePoints(r ?? '3mm'),
    bottom: parsePoints(b ?? '3mm'),
    left: parsePoints(l ?? '3mm'),
  };
}

function uniform(value: number): BleedBox {
  return { top: value, right: value, bottom: value, left: value };
}

/** Convert a CSS dimension (mm/cm/in/pt) to PDF points. */
function parsePoints(value: string): number {
  const m = value.match(/^([\d.]+)(mm|pt|in|cm)?$/);
  if (!m) return 3 / MM_PER_PT;
  const n = Number.parseFloat(m[1] ?? '0');
  switch (m[2]) {
    case 'pt':
      return n;
    case 'in':
      return n * 72;
    case 'cm':
      return (n * 10) / MM_PER_PT;
    default:
      return n / MM_PER_PT;
  }
}
