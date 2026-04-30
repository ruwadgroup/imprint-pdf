// @imprint/print — PDF/X-4, CMYK, ICC profiles, spot colors, bleed/trim marks
// BSL-1.1 licensed — see LICENSE-BSL for terms

// ---------------------------------------------------------------------------
// Document / Page prop interfaces
// ---------------------------------------------------------------------------

export interface PrintDocumentProps {
  /** PDF/X or PDF/A output intent. */
  intent?: 'PDF/X-4' | 'PDF/X-4p' | 'PDF/A-2b' | 'PDF/A-3';
  /** ICC output intent descriptor required for PDF/X-4 conformance. */
  outputIntent?: {
    /** Path on disk or URL to the ICC profile (.icc / .icm). */
    profile: string;
    /** Human-readable condition string, e.g. "FOGRA39". */
    condition?: string;
    /** Standardised condition identifier, e.g. "FOGRA39". */
    conditionIdentifier?: string;
    /** Registry URL, typically "http://www.color.org". */
    registry?: string;
  };
  /** File attachments embedded in the PDF (PDF/A-3 associated files). */
  embeds?: Array<{
    data: Uint8Array | string;
    filename: string;
    description?: string;
    mimeType?: string;
  }>;
}

export interface PrintPageProps {
  /** Bleed amount as a CSS-like length (e.g. "3mm", "0.125in"). */
  bleed?: string;
  /** Which printer marks to include. */
  marks?: 'all' | 'crop' | 'bleed' | 'registration' | 'none';
  /** Path to an ICC profile to apply to this page's output intent. */
  colorProfile?: string;
}

// ---------------------------------------------------------------------------
// CMYK colour utilities
// ---------------------------------------------------------------------------

export interface CmykColor {
  /** Cyan channel, 0–100. */
  c: number;
  /** Magenta channel, 0–100. */
  m: number;
  /** Yellow channel, 0–100. */
  y: number;
  /** Key (black) channel, 0–100. */
  k: number;
}

/**
 * Approximate conversion from sRGB hex string (#rrggbb) to CMYK.
 * No ICC colour management — suitable only for quick estimations.
 */
export function rgbToCmyk(hex: string): CmykColor {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

/**
 * Parse the value portion of an `imprint:cmyk-[c,m,y,k]` Tailwind class.
 *
 * @example
 * parseCmykClass('0,100,100,0') // => { c: 0, m: 100, y: 100, k: 0 }  (red)
 */
export function parseCmykClass(value: string): CmykColor | null {
  const match = value.match(/^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return {
    c: parseFloat(match[1] ?? '0'),
    m: parseFloat(match[2] ?? '0'),
    y: parseFloat(match[3] ?? '0'),
    k: parseFloat(match[4] ?? '0'),
  };
}

// ---------------------------------------------------------------------------
// Spot colour support
// ---------------------------------------------------------------------------

export interface SpotColor {
  /** Spot colour name as it should appear in the PDF colour space, e.g. "PANTONE 485 C". */
  name: string;
  /** Alternate CMYK tint approximation — used for screen preview. */
  c: number;
  m: number;
  y: number;
  k: number;
  /** Tint percentage (0–100); defaults to 100 (full ink). */
  tint?: number;
}

/**
 * Define a spot (separation) colour with a CMYK fallback tint approximation.
 *
 * @example
 * const pantone485 = defineSpotColor('PANTONE 485 C', { c: 0, m: 100, y: 100, k: 0 })
 */
export function defineSpotColor(name: string, cmyk: CmykColor, tint = 100): SpotColor {
  return { name, ...cmyk, tint };
}

// ---------------------------------------------------------------------------
// Bleed / trim box calculation helpers
// ---------------------------------------------------------------------------

export interface BleedBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Parse a CSS-style bleed string into absolute points.
 *
 * Supports 1-value, 2-value, and 4-value shorthand (top right bottom left).
 *
 * @example
 * parseBleed('3mm')           // => { top: 8.50, right: 8.50, bottom: 8.50, left: 8.50 }
 * parseBleed('3mm 6mm')       // => { top: 8.50, right: 17.01, bottom: 8.50, left: 17.01 }
 * parseBleed('3mm 6mm 3mm 6mm')
 */
export function parseBleed(bleed: string): BleedBox {
  const mmToPt = (v: number) => v * 2.8346472;

  const parts = bleed.trim().split(/\s+/);

  if (parts.length === 1) {
    const v = mmToPt(parseDimension(parts[0] ?? '3mm'));
    return { top: v, right: v, bottom: v, left: v };
  }

  if (parts.length === 2) {
    const tb = mmToPt(parseDimension(parts[0] ?? '3mm'));
    const rl = mmToPt(parseDimension(parts[1] ?? '3mm'));
    return { top: tb, right: rl, bottom: tb, left: rl };
  }

  const [t = '3mm', r = '3mm', b = '3mm', l = '3mm'] = parts;
  return {
    top: mmToPt(parseDimension(t)),
    right: mmToPt(parseDimension(r)),
    bottom: mmToPt(parseDimension(b)),
    left: mmToPt(parseDimension(l)),
  };
}

/**
 * Parse a dimension string into millimetres.
 * Supported units: mm (default), pt, in, cm.
 */
function parseDimension(value: string): number {
  const match = value.match(/^([\d.]+)(mm|pt|in|cm)?$/);
  if (!match) return 3; // fallback: 3 mm

  const n = parseFloat(match[1] ?? '3');
  switch (match[2]) {
    case 'pt':
      return n / 2.8346472; // pt → mm
    case 'in':
      return n * 25.4;
    case 'cm':
      return n * 10;
    default:
      return n; // mm
  }
}
