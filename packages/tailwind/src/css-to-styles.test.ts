import { describe, expect, it } from 'vitest';
import { parseCssToStyleMap } from './css-to-styles.js';

const cssWithVars = `
:root, :host {
  --color-gray-900: oklch(21% 0.034 264.665);
  --color-white: #fff;
  --color-indigo-500: oklch(58.5% 0.233 277.117);
  --spacing: 0.25rem;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1rem;
  --font-weight-bold: 700;
  --radius-md: 0.375rem;
}

.flex { display: flex; }
.flex-row { flex-direction: row; }
.flex-1 { flex: 1 1 0%; }
.font-bold { --tw-font-weight: var(--font-weight-bold); font-weight: var(--font-weight-bold); }
.text-xs { font-size: var(--text-xs); line-height: var(--tw-leading, var(--text-xs--line-height)); }
.text-gray-900 { color: var(--color-gray-900); }
.bg-white { background-color: var(--color-white); }
.px-12 { padding-inline: calc(var(--spacing) * 12); }
.py-2 { padding-block: calc(var(--spacing) * 2); }
.rounded-md { border-radius: var(--radius-md); }
.text-indigo-500 { color: var(--color-indigo-500); }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.mb-4 { margin-bottom: calc(var(--spacing) * 4); }
`;

// Helper: extract pt value from a 'Npt' string or number
function asPt(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.endsWith('pt')) return parseFloat(v);
  return Number(v);
}

describe('parseCssToStyleMap', () => {
  const map = parseCssToStyleMap(cssWithVars);

  it('parses display utilities', () => {
    expect(map.get('flex')).toMatchObject({ display: 'flex' });
    expect(map.get('flex-row')).toMatchObject({ flexDirection: 'row' });
  });

  it('resolves font-weight CSS variable', () => {
    const bold = map.get('font-bold');
    expect(Number(bold?.fontWeight)).toBe(700);
  });

  it('resolves font-size CSS variable (0.75rem = 9pt)', () => {
    const xs = map.get('text-xs');
    // 0.75rem * 16 = 12px = 9pt
    expect(asPt(xs?.fontSize)).toBeCloseTo(9);
  });

  it('resolves line-height as pt string so measureText treats it as absolute', () => {
    const xs = map.get('text-xs');
    // 1rem * 16 = 16px = 12pt — must be a string ending in pt so measureText
    // uses the absolute branch instead of unitless-ratio branch
    const lh = xs?.lineHeight;
    expect(typeof lh === 'string' && String(lh).endsWith('pt')).toBe(true);
    expect(asPt(lh)).toBeCloseTo(12);
  });

  it('resolves oklch color for text-gray-900', () => {
    const style = map.get('text-gray-900');
    expect(style?.color).toMatch(/^#[0-9a-f]{6}$/i);
    const hex = style!.color!.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    expect(r).toBeLessThan(50);
  });

  it('resolves #fff shorthand for bg-white', () => {
    expect(map.get('bg-white')?.backgroundColor).toMatch(/^#fff/i);
  });

  it('resolves padding-inline to pt strings', () => {
    const px12 = map.get('px-12');
    // 0.25rem * 12 * 16 * 0.75 = 36pt
    expect(asPt(px12?.paddingLeft)).toBeCloseTo(36);
    expect(asPt(px12?.paddingRight)).toBeCloseTo(36);
  });

  it('resolves padding-block (py-2) to pt', () => {
    const py2 = map.get('py-2');
    // 0.25rem * 2 * 16 * 0.75 = 6pt
    expect(asPt(py2?.paddingTop)).toBeCloseTo(6);
    expect(asPt(py2?.paddingBottom)).toBeCloseTo(6);
  });

  it('resolves border-radius CSS variable to pt', () => {
    const rm = map.get('rounded-md');
    // 0.375rem * 16 * 0.75 = 4.5pt
    expect(asPt(rm?.borderRadius)).toBeCloseTo(4.5);
  });

  it('resolves oklch for indigo-500', () => {
    expect(map.get('text-indigo-500')?.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('parses alignment utilities', () => {
    expect(map.get('items-start')).toMatchObject({ alignItems: 'flex-start' });
    expect(map.get('justify-between')).toMatchObject({ justifyContent: 'space-between' });
  });

  it('resolves margin to pt', () => {
    const mb4 = map.get('mb-4');
    // 0.25rem * 4 * 16 * 0.75 = 12pt
    expect(asPt(mb4?.marginBottom)).toBeCloseTo(12);
  });

  it('ignores pseudo-class selectors', () => {
    const css = '.hover\\:text-red:hover { color: red; }';
    expect(parseCssToStyleMap(css).size).toBe(0);
  });

  it('ignores CSS custom properties in declarations', () => {
    const css = '.foo { --tw-ring: 0; color: red; }';
    expect(parseCssToStyleMap(css).get('foo')).toMatchObject({ color: 'red' });
  });
});

describe('opacity normalization', () => {
  it('converts percentage opacity to a 0-1 decimal', () => {
    const css = '.opacity-40 { opacity: 40% }';
    expect(parseCssToStyleMap(css).get('opacity-40')).toMatchObject({ opacity: '0.4' });
  });
  it('clamps a bare 0-100 opacity into range', () => {
    const css = '.o { opacity: 70 }';
    expect(parseCssToStyleMap(css).get('o')).toMatchObject({ opacity: '0.7' });
  });
});

describe('transform utilities', () => {
  it('composes rotate/scale/translate properties into a transform', () => {
    const css = `
      @property --tw-scale-x { syntax: "*"; inherits: false; initial-value: 1 }
      @property --tw-scale-y { syntax: "*"; inherits: false; initial-value: 1 }
      .-rotate-90 { rotate: calc(90deg * -1) }
      .scale-x-flip { --tw-scale-x: -1; scale: var(--tw-scale-x) var(--tw-scale-y) }
    `;
    const map = parseCssToStyleMap(css);
    expect(map.get('-rotate-90')).toMatchObject({ transform: 'rotate(-90deg)' });
    expect(map.get('scale-x-flip')).toMatchObject({ transform: 'scale(-1 1)' });
  });
});
