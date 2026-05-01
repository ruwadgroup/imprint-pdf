/** Named page sizes in PDF points. `PageSize` is derived from these keys. */
export const PAGE_SIZES = {
  A0: [2383.94, 3370.39],
  A1: [1683.78, 2383.94],
  A2: [1190.55, 1683.78],
  A3: [841.89, 1190.55],
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  A6: [297.64, 419.53],
  B4: [708.66, 1000.63],
  B5: [498.9, 708.66],
  B6: [354.33, 498.9],
  Letter: [612, 792],
  Legal: [612, 1008],
  Tabloid: [792, 1224],
  Ledger: [1224, 792],
  Executive: [521.86, 756],
  DL: [311.81, 623.62],
  C5: [459.21, 649.13],
} as const satisfies Record<string, readonly [number, number]>;

export type NamedPageSize = keyof typeof PAGE_SIZES;

export const UNIT_TO_PT = { pt: 1, mm: 2.8346, cm: 28.346, in: 72, px: 0.75 } as const;

export function resolvePt(value: string | number | undefined, base: number): number {
  if (value === undefined || value === '' || value === 'auto') return base;
  if (typeof value === 'number') return value;
  if (value.endsWith('%')) return (parseFloat(value) / 100) * base;
  if (value.endsWith('px')) return parseFloat(value) * UNIT_TO_PT.px;
  if (value.endsWith('pt')) return parseFloat(value);
  if (value.endsWith('mm')) return parseFloat(value) * UNIT_TO_PT.mm;
  if (value.endsWith('cm')) return parseFloat(value) * UNIT_TO_PT.cm;
  if (value.endsWith('in')) return parseFloat(value) * UNIT_TO_PT.in;
  if (value.endsWith('em')) return parseFloat(value) * 12;
  if (value.endsWith('rem')) return parseFloat(value) * 16 * UNIT_TO_PT.px;
  const num = parseFloat(value);
  return Number.isNaN(num) ? base : num;
}

export function resolveOptionalPt(value: string | number | undefined): number | undefined {
  if (value === undefined || value === 'auto' || value === '') return undefined;
  if (typeof value === 'number') return value;
  if (value.endsWith('%')) return undefined;
  return resolvePt(value, 0);
}
