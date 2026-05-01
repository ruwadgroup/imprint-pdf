import { describe, expect, it } from 'vitest';
import type { DocumentNode, PageNode, PdfNode, VariantStyles, ViewNode } from '../types.js';
import { applyImprintVariants } from './variants.js';

function view(id: string, variants?: VariantStyles): ViewNode {
  const node: ViewNode = { type: 'view', id, props: {}, style: {}, children: [] };
  if (variants) node.variants = variants;
  return node;
}

function page(
  id: string,
  children: PdfNode[] = [],
  extraProps: Record<string, unknown> = {},
): PageNode {
  return { type: 'page', id, props: extraProps, style: {}, children };
}

function doc(pages: PageNode[]): DocumentNode {
  return { type: 'document', id: 'd', props: {}, style: {}, children: pages };
}

describe('applyImprintVariants', () => {
  it('folds page-first variant into nodes on the first page only', () => {
    const variants: VariantStyles = { 'page-first': { padding: '12pt' } };
    const out = applyImprintVariants(
      doc([page('p1', [view('a', variants)]), page('p2', [view('b', variants)])]),
    );
    expect((out.children[0] as PageNode).children[0]?.style.padding).toBe('12pt');
    expect((out.children[1] as PageNode).children[0]?.style.padding).toBeUndefined();
  });

  it('alternates page-left / page-right by 1-based page parity (page 1 is right)', () => {
    const variants: VariantStyles = {
      'page-left': { color: 'red' },
      'page-right': { color: 'blue' },
    };
    const out = applyImprintVariants(
      doc([
        page('p1', [view('a', variants)]),
        page('p2', [view('b', variants)]),
        page('p3', [view('c', variants)]),
      ]),
    );
    expect((out.children[0] as PageNode).children[0]?.style.color).toBe('blue');
    expect((out.children[1] as PageNode).children[0]?.style.color).toBe('red');
    expect((out.children[2] as PageNode).children[0]?.style.color).toBe('blue');
  });

  it('applies bleed variant when the page declares bleed > 0', () => {
    const variants: VariantStyles = { bleed: { backgroundColor: 'cyan' } };
    const out = applyImprintVariants(
      doc([page('p1', [view('a', variants)], { bleed: 9 }), page('p2', [view('b', variants)])]),
    );
    expect((out.children[0] as PageNode).children[0]?.style.backgroundColor).toBe('cyan');
    expect((out.children[1] as PageNode).children[0]?.style.backgroundColor).toBeUndefined();
  });

  it('walks deeply nested children', () => {
    const inner = view('inner', { 'page-first': { color: 'green' } });
    const out = applyImprintVariants(doc([page('p1', [view('outer', undefined)])]));
    // First check the unmodified case — variants on a child added later:
    const tree = doc([page('p1', [{ ...view('mid'), children: [inner] } as ViewNode])]);
    const applied = applyImprintVariants(tree);
    const midPage = applied.children[0] as PageNode;
    const mid = midPage.children[0] as ViewNode;
    expect(mid.children[0]?.style.color).toBe('green');
    expect(out).toBeDefined();
  });

  it('leaves nodes without variants untouched', () => {
    const out = applyImprintVariants(doc([page('p1', [view('plain')])]));
    expect((out.children[0] as PageNode).children[0]?.style).toEqual({});
  });

  it('returns a new tree without mutating the input', () => {
    const child = view('a', { 'page-first': { padding: '12pt' } });
    const inputDoc = doc([page('p1', [child])]);
    applyImprintVariants(inputDoc);
    expect(child.style.padding).toBeUndefined();
  });
});
