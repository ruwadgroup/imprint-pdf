import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// imprint converts CSS lengths to PDF points as `rem -> px` (x16) `-> pt`
// (x0.75), i.e. `pt = rem * 12`. The shipped print preset must set every
// `--text-*` var so the resolved point size matches the documented scale.
const REM_TO_PT = 12;

const presetCss = readFileSync(fileURLToPath(new URL('../preset.css', import.meta.url)), 'utf8');

function remOf(token: string): number {
  const match = presetCss.match(new RegExp(`--text-${token}:\\s*([\\d.]+)rem`));
  if (!match?.[1]) throw new Error(`--text-${token} not found in preset.css`);
  return parseFloat(match[1]);
}

describe('print preset type scale', () => {
  // token -> expected point size
  const cases: Array<[string, number]> = [
    ['2xs', 6],
    ['xs', 7],
    ['sm', 8],
    ['base', 9],
    ['lg', 11],
    ['xl', 15],
    ['2xl', 18],
    ['3xl', 22],
    ['4xl', 28],
    ['5xl', 36],
    ['6xl', 48],
    ['7xl', 60],
    ['8xl', 72],
    ['9xl', 96],
  ];

  it.each(cases)('text-%s resolves to %dpt', (token, expectedPt) => {
    const pt = remOf(token) * REM_TO_PT;
    // rem values are rounded to 4 decimals, so allow a sub-thousandth slack.
    expect(pt).toBeCloseTo(expectedPt, 2);
  });

  it('ships the imprint-only text-2xs token', () => {
    expect(presetCss).toMatch(/--text-2xs:/);
  });

  it('tunes tracking-tight to -0.01em', () => {
    expect(presetCss).toMatch(/--tracking-tight:\s*-0\.01em/);
  });
});
