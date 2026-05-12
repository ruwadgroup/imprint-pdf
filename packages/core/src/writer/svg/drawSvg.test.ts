import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { drawSvgString } from './drawSvg.js';
import { parseSvg } from './parser.js';
import { shapeToPath } from './paths.js';
import { parseTransform } from './transform.js';

describe('parseSvg', () => {
  it('parses well-formed SVG into a tree', () => {
    const root = parseSvg(
      '<svg viewBox="0 0 10 10"><rect x="1" y="2" width="3" height="4" fill="red"/></svg>',
    );
    expect(root?.tag).toBe('svg');
    expect(root?.attrs.viewBox).toBe('0 0 10 10');
    expect(root?.children[0]?.tag).toBe('rect');
    expect(root?.children[0]?.attrs.fill).toBe('red');
  });

  it('decodes basic XML entities', () => {
    const root = parseSvg('<svg><title>A &amp; B</title></svg>');
    expect(root?.children[0]?.text).toBe('A & B');
  });
});

describe('shapeToPath', () => {
  it('converts rect to path', () => {
    const root = parseSvg('<svg><rect x="0" y="0" width="10" height="20"/></svg>');
    const d = shapeToPath(root!.children[0]!);
    expect(d).toContain('M 0 0');
    expect(d).toContain('H 10');
    expect(d).toContain('V 20');
  });

  it('converts circle to arc-based path', () => {
    const root = parseSvg('<svg><circle cx="5" cy="5" r="3"/></svg>');
    const d = shapeToPath(root!.children[0]!);
    expect(d).toMatch(/^M 2 5/);
    expect(d).toContain('A 3 3');
  });

  it('returns null for zero-radius circle', () => {
    const root = parseSvg('<svg><circle cx="0" cy="0" r="0"/></svg>');
    expect(shapeToPath(root!.children[0]!)).toBe(null);
  });
});

describe('parseTransform', () => {
  it('returns identity for empty input', () => {
    expect(parseTransform(undefined)).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it('parses translate', () => {
    expect(parseTransform('translate(10, 20)')).toEqual([1, 0, 0, 1, 10, 20]);
  });

  it('parses scale with single arg', () => {
    expect(parseTransform('scale(2)')).toEqual([2, 0, 0, 2, 0, 0]);
  });

  it('composes transforms left-to-right', () => {
    const m = parseTransform('translate(10, 0) scale(2)');
    // (x, y) → translate to (x + 10, y) then scale → (2x + 10, 2y)
    expect(m).toEqual([2, 0, 0, 2, 10, 0]);
  });
});

describe('drawSvgString', () => {
  it('emits operators for a basic rect-with-gradient and finishes without throwing', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    const svg = `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g">
            <stop offset="0" stop-color="red"/>
            <stop offset="1" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="80" height="80" fill="url(#g)" stroke="black" stroke-width="2"/>
      </svg>
    `;
    const ok = drawSvgString(svg, page, { x: 0, y: 0, width: 200, height: 200 }, 200);
    expect(ok).toBe(true);
    const bytes = await doc.save();
    expect(bytes.length).toBeGreaterThan(500);
  });

  it('handles paths and clip-path references', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    const svg = `
      <svg viewBox="0 0 100 100">
        <defs>
          <clipPath id="c"><rect x="0" y="0" width="50" height="100"/></clipPath>
        </defs>
        <path d="M 10 10 L 90 10 L 90 90 L 10 90 Z" fill="green" clip-path="url(#c)"/>
      </svg>
    `;
    const ok = drawSvgString(svg, page, { x: 0, y: 0, width: 200, height: 200 }, 200);
    expect(ok).toBe(true);
    const bytes = await doc.save();
    expect(bytes.length).toBeGreaterThan(500);
  });

  it('returns false for non-SVG input', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([100, 100]);
    expect(drawSvgString('<div></div>', page, { x: 0, y: 0, width: 50, height: 50 }, 100)).toBe(
      false,
    );
  });

  it('returns false for zero-area viewBox without throwing', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([100, 100]);
    const svg = '<svg viewBox="0 0 0 0"><rect width="1" height="1"/></svg>';
    expect(drawSvgString(svg, page, { x: 0, y: 0, width: 50, height: 50 }, 100)).toBe(false);
  });
});
