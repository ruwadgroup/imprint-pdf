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

// Shallow-clones each node so one authored tree can render under different
// variant contexts (proof PDF then CMYK plate) without cross-contamination.
// `<PageNumber>` / `<TotalPages>` marker views lower to plain text nodes here,
// and a container left with only text runs collapses them into one node — so
// `<span>Page <PageNumber /> of <TotalPages /></span>` measures and draws as
// the single string "Page 2 of 4" (per-run text loses boundary whitespace).
function applyToSubtree(node: PdfNode, active: Set<ImprintVariant>, ctx: VariantContext): PdfNode {
  let style = node.style;
  if (node.variants) {
    for (const variant of active) {
      const v = node.variants[variant];
      if (v) style = mergeStyles(style, v);
    }
  }

  const props = node.props as Record<string, unknown>;
  if (props.__pageNumber === true || props.__totalPages === true) {
    const value = props.__pageNumber === true ? String(ctx.pageIndex + 1) : String(ctx.pageCount);
    return {
      type: 'text',
      id: node.id,
      text: value,
      style,
      props: {},
      children: [],
    } satisfies TextNode;
  }

  let children = node.children.map((c) => applyToSubtree(c, active, ctx));
  if (children.length > 1 && children.every((c) => c.type === 'text')) {
    const merged = children.map((c) => (c.type === 'text' ? (c.text ?? '') : '')).join('');
    const first = children[0] as TextNode;
    children = [{ ...first, text: merged, style, children: [] }];
  }

  return { ...node, style, children } as PdfNode;
}

// Running elements are document-level by contract, but authoring them inside
// the first `<Page>` is a natural mistake — without hoisting they'd silently
// lay out as ordinary in-flow content (the footer would render mid-page).
const RUNNING_TYPES = new Set(['header', 'footer', 'watermark']);

function hoistRunningElements(document: DocumentNode): DocumentNode {
  const hoisted: PdfNode[] = [];
  let changed = false;

  const children = document.children.map((child) => {
    if (child.type !== 'page') return child;
    const running = child.children.filter((c) => RUNNING_TYPES.has(c.type));
    if (running.length === 0) return child;
    changed = true;
    for (const node of running) {
      // First instance of each type wins, matching the document-level rule.
      if (!hoisted.some((h) => h.type === node.type)) hoisted.push(node);
    }
    return { ...child, children: child.children.filter((c) => !RUNNING_TYPES.has(c.type)) };
  });

  if (!changed) return document;
  const kept = hoisted.filter((h) => !document.children.some((c) => c.type === h.type));
  return { ...document, children: [...children, ...kept] } as DocumentNode;
}

export function applyImprintVariants(document: DocumentNode): DocumentNode {
  const normalized = hoistRunningElements(document);
  const pageNodes = normalized.children.filter((c): c is PageNode => c.type === 'page');
  const pageCount = pageNodes.length;

  let pageIndex = 0;
  const newChildren = normalized.children.map((child) => {
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

  return { ...normalized, children: newChildren };
}

// Per-page substitution for running header/footer/watermark trees — authored
// once, drawn on every page. Returns a fresh clone with `<PageNumber>` /
// `<TotalPages>` markers filled in for the given page. Page variants apply
// here too, so `page:first:hidden` can keep a running element off a cover.
export function substitutePageMarkers(
  node: PdfNode,
  pageIndex: number,
  pageCount: number,
): PdfNode {
  const ctx: VariantContext = { pageIndex, pageCount, bleed: false, cmyk: false };
  return applyToSubtree(node, variantsActiveFor(ctx), ctx);
}
