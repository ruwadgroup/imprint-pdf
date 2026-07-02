import { describe, expect, it } from 'vitest';
import type { ComputedGeometry, DocumentNode, PageNode, PdfNode } from '../types.js';
import { paginateDocument } from './paginate.js';

const PAGE_H = 800;
const PAD = 50;

function geo(
  y: number,
  height: number,
  overrides: Partial<ComputedGeometry> = {},
): ComputedGeometry {
  return {
    x: 0,
    y,
    width: 500,
    height,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    contentWidth: 500,
    contentHeight: height,
    ...overrides,
  };
}

function view(id: string, children: PdfNode[] = [], style: PdfNode['style'] = {}): PdfNode {
  return { type: 'view', id, props: {}, style, children } as PdfNode;
}

function text(id: string): PdfNode {
  return { type: 'text', id, text: 'x', props: {}, style: {}, children: [] } as PdfNode;
}

/** A page with `n` stacked rows of the given height, plus its geometry map. */
function makeDoc(
  rows: number,
  rowHeight: number,
): {
  document: DocumentNode;
  geometries: Map<string, ComputedGeometry>;
} {
  const geometries = new Map<string, ComputedGeometry>();
  const children: PdfNode[] = [];
  for (let i = 0; i < rows; i++) {
    const row = view(`row${i}`, [text(`t${i}`)]);
    children.push(row);
    geometries.set(`row${i}`, geo(PAD + i * rowHeight, rowHeight));
    geometries.set(`t${i}`, geo(PAD + i * rowHeight, rowHeight));
  }
  const page = { type: 'page', id: 'pg', props: {}, style: {}, children } as PageNode;
  const document = {
    type: 'document',
    id: 'doc',
    props: {},
    style: {},
    children: [page],
  } as DocumentNode;
  geometries.set('pg', geo(0, PAGE_H, { paddingTop: PAD, paddingBottom: PAD }));
  return { document, geometries };
}

describe('paginateDocument', () => {
  it('returns the input untouched when content fits', () => {
    const { document, geometries } = makeDoc(5, 100);
    const result = paginateDocument(document, geometries);
    expect(result.document).toBe(document);
    expect(result.geometries).toBe(geometries);
  });

  it('splits overflowing rows across pages at row boundaries', () => {
    const { document, geometries } = makeDoc(12, 100); // 1200pt of rows in a 700pt box
    const result = paginateDocument(document, geometries);
    const pages = result.document.children.filter((c) => c.type === 'page');
    expect(pages.length).toBeGreaterThanOrEqual(2);

    // Every fragment's rows must fit inside the physical page.
    for (const page of pages) {
      for (const child of page.children) {
        const g = result.geometries.get(child.id)!;
        expect(g.y).toBeGreaterThanOrEqual(PAD - 0.5);
        expect(g.y + g.height).toBeLessThanOrEqual(PAGE_H - PAD + 0.5);
        // Rows are atomic (leaf text inside): never sliced.
        expect(g.height).toBeCloseTo(100, 1);
      }
    }

    // All 12 rows survive, each exactly once.
    const drawn = pages.flatMap((p) => p.children.map((c) => c.id.split('.')[0]));
    expect(new Set(drawn).size).toBe(12);
    expect(drawn).toHaveLength(12);
  });

  it('continuation pages restart at the top padding', () => {
    const { document, geometries } = makeDoc(12, 100);
    const result = paginateDocument(document, geometries);
    const pages = result.document.children.filter((c) => c.type === 'page');
    const second = pages[1]!;
    const firstChild = second.children[0]!;
    expect(result.geometries.get(firstChild.id)!.y).toBeCloseTo(PAD, 1);
  });

  it('never breaks inside break-inside: avoid containers', () => {
    const geometries = new Map<string, ComputedGeometry>();
    // One 600pt keep-together block after 300pt of rows: must move to page 2.
    const rowA = view('a', [text('ta')]);
    geometries.set('a', geo(PAD, 300));
    geometries.set('ta', geo(PAD, 300));
    const inner = [view('k1', [text('tk1')]), view('k2', [text('tk2')])];
    geometries.set('k1', geo(PAD + 300, 300));
    geometries.set('tk1', geo(PAD + 300, 300));
    geometries.set('k2', geo(PAD + 600, 300));
    geometries.set('tk2', geo(PAD + 600, 300));
    const keep = view('keep', inner, { breakInside: 'avoid' });
    geometries.set('keep', geo(PAD + 300, 600));
    const page = {
      type: 'page',
      id: 'pg',
      props: {},
      style: {},
      children: [rowA, keep],
    } as PageNode;
    geometries.set('pg', geo(0, PAGE_H, { paddingTop: PAD, paddingBottom: PAD }));
    const document = {
      type: 'document',
      id: 'doc',
      props: {},
      style: {},
      children: [page],
    } as DocumentNode;

    const result = paginateDocument(document, geometries);
    const pages = result.document.children.filter((c) => c.type === 'page');
    expect(pages).toHaveLength(2);
    expect(pages[0]!.children.map((c) => c.id)).toEqual(['a']);
    const keepFrag = pages[1]!.children[0]!;
    expect(keepFrag.id).toBe('keep.p1');
    expect(result.geometries.get(keepFrag.id)!.height).toBeCloseTo(600, 1);
  });

  it('honors forced breaks from <PageBreak> even when content fits', () => {
    const geometries = new Map<string, ComputedGeometry>();
    const a = view('a', [text('ta')]);
    geometries.set('a', geo(PAD, 100));
    geometries.set('ta', geo(PAD, 100));
    const br = { type: 'pagebreak', id: 'br', props: {}, style: {}, children: [] } as PdfNode;
    geometries.set('br', geo(PAD + 100, 0));
    const b = view('b', [text('tb')]);
    geometries.set('b', geo(PAD + 100, 100));
    geometries.set('tb', geo(PAD + 100, 100));
    const page = { type: 'page', id: 'pg', props: {}, style: {}, children: [a, br, b] } as PageNode;
    geometries.set('pg', geo(0, PAGE_H, { paddingTop: PAD, paddingBottom: PAD }));
    const document = {
      type: 'document',
      id: 'doc',
      props: {},
      style: {},
      children: [page],
    } as DocumentNode;

    const result = paginateDocument(document, geometries);
    const pages = result.document.children.filter((c) => c.type === 'page');
    expect(pages).toHaveLength(2);
    expect(pages[0]!.children.map((c) => c.id)).toContain('a');
    expect(pages[1]!.children.map((c) => c.id.split('.')[0])).toContain('b');
  });
});
