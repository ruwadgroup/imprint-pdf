import type { DocumentNode, ImprintVariant, PageNode, PdfNode } from '../types.js';
import { mergeStyles } from './resolver.js';

export interface VariantContext {
  pageIndex: number;
  pageCount: number;
  bleed: boolean;
  cmyk: boolean;
}

// Print convention: page 1 is recto (right), page 2 verso (left), etc.
function variantsActiveFor(ctx: VariantContext): Set<ImprintVariant> {
  const active = new Set<ImprintVariant>();
  if (ctx.pageIndex === 0) active.add('page-first');
  if (ctx.pageIndex % 2 === 0) active.add('page-right');
  else active.add('page-left');
  if (ctx.bleed) active.add('bleed');
  if (ctx.cmyk) active.add('cmyk');
  return active;
}

// Shallow-clones each node so the same authored tree can render with
// different variant contexts (proof PDF, then CMYK plate) without
// cross-contamination.
function applyToSubtree(node: PdfNode, active: Set<ImprintVariant>): PdfNode {
  let style = node.style;
  if (node.variants) {
    for (const variant of active) {
      const v = node.variants[variant];
      if (v) style = mergeStyles(style, v);
    }
  }
  const children = node.children.map((c) => applyToSubtree(c, active));
  return { ...node, style, children } as PdfNode;
}

export function applyImprintVariants(document: DocumentNode): DocumentNode {
  const pageNodes = document.children.filter((c): c is PageNode => c.type === 'page');
  const pageCount = pageNodes.length;

  let pageIndex = 0;
  const newChildren = document.children.map((child) => {
    if (child.type !== 'page') return child;
    const page = child as PageNode;
    const ctx: VariantContext = {
      pageIndex,
      pageCount,
      bleed: typeof page.props.bleed === 'number' && page.props.bleed > 0,
      cmyk: false,
    };
    pageIndex += 1;
    return applyToSubtree(page, variantsActiveFor(ctx));
  });

  return { ...document, children: newChildren };
}
