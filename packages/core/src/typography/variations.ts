/** Parses CSS `font-variation-settings` (`"wght" 700, "wdth" 80`) into HarfBuzz's axis map. */
export function parseVariationSettings(value: string | undefined): Record<string, number> {
  if (!value || value === 'normal') return {};
  const out: Record<string, number> = {};
  for (const part of value.split(',')) {
    const m = /\s*"([^"]{1,4})"\s+(-?\d+(?:\.\d+)?)/.exec(part);
    if (m?.[1] && m[2] !== undefined) {
      out[m[1]] = parseFloat(m[2]);
    }
  }
  return out;
}

const STRETCH_PERCENTS: Record<string, number> = {
  'ultra-condensed': 50,
  'extra-condensed': 62.5,
  condensed: 75,
  'semi-condensed': 87.5,
  normal: 100,
  'semi-expanded': 112.5,
  expanded: 125,
  'extra-expanded': 150,
  'ultra-expanded': 200,
};

// Lifts `font-weight` / `font-stretch` onto the `wght` / `wdth` axes when
// no explicit `font-variation-settings` is set.
export function deriveAxesFromStyle(style: {
  fontVariationSettings?: string;
  fontWeight?: string | number;
  fontStretch?: string | number;
}): Record<string, number> {
  const out = parseVariationSettings(style.fontVariationSettings);
  if (out.wght === undefined && style.fontWeight !== undefined) {
    const n =
      typeof style.fontWeight === 'number' ? style.fontWeight : parseFloat(style.fontWeight);
    if (!Number.isNaN(n)) out.wght = n;
  }
  if (out.wdth === undefined && style.fontStretch !== undefined) {
    const raw = String(style.fontStretch).trim();
    const pct =
      STRETCH_PERCENTS[raw] ??
      (raw.endsWith('%')
        ? parseFloat(raw)
        : Number.isFinite(parseFloat(raw))
          ? parseFloat(raw)
          : undefined);
    if (pct !== undefined) out.wdth = pct;
  }
  return out;
}
