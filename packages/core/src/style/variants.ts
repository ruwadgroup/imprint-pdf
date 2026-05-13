import type { DocumentNode, ImprintVariant, PageNode, PdfNode, TextNode } from '../types.js';
import { mergeStyles } from './resolver.js';

export interface VariantContext {
  pageIndex: number;
  pageCount: number;
  bleed: boolean;
  cmyk: boolean;
}

// Print convention: page 1 is recto (right), page 2 is verso (left), and so on.
function variantsActiveFor(ctx: VariantContext): Set<ImprintVariant> {
  const active = new Set<ImprintVariant>();
  if (ctx.pageIndex === 0) active.add('page-first');
  if (ctx.pageIndex % 2 === 0) active.add('page-right');
  else active.add('page-left');
  if (ctx.bleed) active.add('bleed');
  if (ctx.cmyk) active.add('cmyk');
  return active;
}

// `<PageNumber>` / `<TotalPages>` lower to a `view` carrying these flags.
// Resolved here so the substitution rides the same per-page clone that applies
// page-* variants — no extra walk. The text node carries empty style; drawText
// inherits from inline context, matching how the reconciler emits literal text.
function makeMarkerText(parent: PdfNode, value: string, suffix: string): TextNode {
  return {
    type: 'text',
    id: `${parent.id}-${suffix}`,
    text: value,
    style: {},
    props: {},
    children: [],
  };
}

// Shallow-clones each node so one authored tree can render under different
// variant contexts (proof PDF then CMYK plate) without cross-contamination.
function applyToSubtree(node: PdfNode, active: Set<ImprintVariant>, ctx: VariantContext): PdfNode {
  let style = node.style;
  if (node.variants) {
    for (const variant of active) {
      const v = node.variants[variant];
      if (v) style = mergeStyles(style, v);
    }
  }

  const props = node.props as Record<string, unknown>;
  const children: PdfNode[] =
    props.__pageNumber === true
      ? [makeMarkerText(node, String(ctx.pageIndex + 1), 'pgn')]
      : props.__totalPages === true
        ? [makeMarkerText(node, String(ctx.pageCount), 'tot')]
        : node.children.map((c) => applyToSubtree(c, active, ctx));

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
    return applyToSubtree(page, variantsActiveFor(ctx), ctx);
  });

  return { ...document, children: newChildren };
}

// Per-page substitution for running header/footer/watermark trees — authored
// once, drawn on every page. Returns a fresh clone with `<PageNumber>` /
// `<TotalPages>` markers filled in for the given page.
export function substitutePageMarkers(
  node: PdfNode,
  pageIndex: number,
  pageCount: number,
): PdfNode {
  const ctx: VariantContext = { pageIndex, pageCount, bleed: false, cmyk: false };
  return applyToSubtree(node, new Set(), ctx);
}
