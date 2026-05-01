import { describe, expect, it } from 'vitest';
import { breakPages, type PageBlock } from './plass.js';

function blocks(...heights: number[]): PageBlock[] {
  return heights.map((h) => ({ height: h }));
}

describe('breakPages', () => {
  it('packs blocks into pages without exceeding page height', () => {
    const pages = breakPages(blocks(100, 100, 100, 100, 100), { pageHeight: 250 });
    expect(pages.length).toBeGreaterThanOrEqual(2);
    for (const p of pages) {
      expect(p.used).toBeLessThanOrEqual(250);
    }
  });

  it('returns one page when all content fits', () => {
    const pages = breakPages(blocks(50, 50, 50), { pageHeight: 500 });
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ start: 0, end: 2, used: 150 });
  });

  it('honors pageBreakBefore on a block', () => {
    const bs: PageBlock[] = [
      { height: 50 },
      { height: 50 },
      { height: 50, pageBreakBefore: true },
      { height: 50 },
    ];
    const pages = breakPages(bs, { pageHeight: 500 });
    expect(pages).toHaveLength(2);
    expect(pages[0]!.end).toBe(1);
    expect(pages[1]!.start).toBe(2);
  });

  it('keeps a heading with the next block (no break after keepWithNext)', () => {
    const bs: PageBlock[] = [{ height: 200 }, { height: 40, keepWithNext: true }, { height: 100 }];
    // The naive break would land after block 1 (the heading) since 200+40=240
    // fits on page 1 of height 250. keepWithNext forbids that, pushing the
    // heading + body onto page 2 together.
    const pages = breakPages(bs, { pageHeight: 250 });
    expect(pages).toHaveLength(2);
    expect(pages[0]!.end).toBe(0);
    expect(pages[1]!.start).toBe(1);
  });

  it('falls back to greedy packing when no feasible DP solution exists', () => {
    // Single block taller than the page — no feasible solution; greedy
    // emits one page anyway so the document at least renders.
    const pages = breakPages(blocks(500, 100), { pageHeight: 250 });
    expect(pages.length).toBeGreaterThan(0);
  });

  it('ignores empty input', () => {
    expect(breakPages([], { pageHeight: 500 })).toEqual([]);
  });

  it('reports a non-negative `used` and a ratio per page', () => {
    const pages = breakPages(blocks(100, 100, 100, 100), { pageHeight: 250 });
    for (const p of pages) {
      expect(p.used).toBeGreaterThanOrEqual(0);
      expect(typeof p.ratio).toBe('number');
    }
  });
});
