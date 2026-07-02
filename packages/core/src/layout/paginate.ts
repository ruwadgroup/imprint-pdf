// Post-layout pagination: splits a laid-out `<Page>` whose content overflows
// the physical page into a run of pages, choosing break positions with the
// Plass total-fit breaker. Operates purely on the (node tree, geometry map)
// pair — no relayout. Widths never change (every fragment page has the same
// content width), so shifting blocks vertically preserves their layout.

import type { ComputedGeometry, DocumentNode, PageNode, PdfNode } from '../types.js';
import { breakPages, type PageBlock } from '../typography/plass.js';

const EPS = 0.5;

/** Node types that can never be split across pages. */
const ATOMIC_TYPES = new Set([
  'text',
  'image',
  'svg',
  'chart',
  'textfield',
  'checkbox',
  'radiogroup',
  'dropdown',
  'signature',
  'button',
  'bookmark',
]);

interface CutCandidates {
  /** Y positions where a break is allowed (tops of stacked blocks). */
  cuts: Set<number>;
  /** Y positions where a break is forced (`<PageBreak>` / `break-before: page`). */
  forced: Set<number>;
  /** [top, bottom] spans that a cut must not fall strictly inside. */
  forbidden: Array<[number, number]>;
}

function isAtomic(node: PdfNode): boolean {
  if (ATOMIC_TYPES.has(node.type)) return true;
  // A leaf box (decorative bar, swatch, spacer) can't reflow — never slice it.
  if (node.children.length === 0) return true;
  const breakInside = node.style.breakInside;
  if (breakInside === 'avoid' || breakInside === 'avoid-page') return true;
  // Slicing an absolutely-positioned overlay produces two half-overlays with
  // no way to reflow them; keep it whole on whichever page it starts.
  if (node.style.position === 'absolute') return true;
  return false;
}

function collectCuts(
  node: PdfNode,
  geometries: Map<string, ComputedGeometry>,
  out: CutCandidates,
): void {
  for (const child of node.children) {
    const geo = geometries.get(child.id);
    if (!geo) continue;
    if (child.type === 'pagebreak' || child.style.breakBefore === 'page') {
      out.forced.add(geo.y);
    }
    out.cuts.add(geo.y);
    if (child.style.breakAfter === 'page') out.forced.add(geo.y + geo.height);
    if (isAtomic(child)) {
      if (geo.height > EPS) out.forbidden.push([geo.y, geo.y + geo.height]);
    } else {
      collectCuts(child, geometries, out);
    }
  }
}

function subtreeBottom(
  node: PdfNode,
  geometries: Map<string, ComputedGeometry>,
  acc: number,
): number {
  const geo = geometries.get(node.id);
  let bottom = acc;
  if (geo) bottom = Math.max(bottom, geo.y + geo.height);
  for (const child of node.children) bottom = subtreeBottom(child, geometries, bottom);
  return bottom;
}

/**
 * Clones the subtree that intersects [bandTop, bandBottom), clamping heights
 * at the band edges and translating everything by `dy`. Nodes fully outside
 * the band are dropped. Returns `null` when nothing intersects.
 */
function sliceNode(
  node: PdfNode,
  geometries: Map<string, ComputedGeometry>,
  outGeometries: Map<string, ComputedGeometry>,
  bandTop: number,
  bandBottom: number,
  dy: number,
  suffix: string,
): PdfNode | null {
  const geo = geometries.get(node.id);
  if (!geo) return null;
  const top = geo.y;
  const bottom = geo.y + geo.height;
  if (bottom <= bandTop + EPS || top >= bandBottom - EPS) {
    // Zero-height nodes sitting exactly on the band edge belong to the band
    // they open (e.g. a <PageBreak> marker) — drop them from both fragments.
    if (geo.height > EPS || top < bandTop || top >= bandBottom) return null;
  }

  const clampedTop = Math.max(top, bandTop);
  const clampedBottom = Math.min(bottom, bandBottom);
  const id = `${node.id}${suffix}`;
  outGeometries.set(id, {
    ...geo,
    y: clampedTop + dy,
    height: Math.max(0, clampedBottom - clampedTop),
  });

  const children: PdfNode[] = [];
  for (const child of node.children) {
    const sliced = sliceNode(child, geometries, outGeometries, bandTop, bandBottom, dy, suffix);
    if (sliced) children.push(sliced);
  }
  return { ...node, id, children } as PdfNode;
}

function paginatePage(
  page: PageNode,
  geometries: Map<string, ComputedGeometry>,
  outGeometries: Map<string, ComputedGeometry>,
): PageNode[] {
  const pageGeo = geometries.get(page.id);
  if (!pageGeo) return [page];

  const pageHeight = pageGeo.height;
  const padTop = pageGeo.paddingTop;
  const padBottom = pageGeo.paddingBottom;

  let contentBottom = 0;
  for (const child of page.children) {
    contentBottom = subtreeBottom(child, geometries, contentBottom);
  }
  const candidates: CutCandidates = { cuts: new Set(), forced: new Set(), forbidden: [] };
  collectCuts(page, geometries, candidates);

  const hasForcedBreak = [...candidates.forced].some((y) => y > EPS && y < contentBottom - EPS);
  if (contentBottom <= pageHeight + EPS && !hasForcedBreak) return [page];

  const usable = pageHeight - padTop - padBottom;
  if (usable <= EPS) return [page];

  let contentTop = Number.POSITIVE_INFINITY;
  for (const child of page.children) {
    const geo = geometries.get(child.id);
    if (geo) contentTop = Math.min(contentTop, geo.y);
  }
  if (!Number.isFinite(contentTop)) return [page];

  const allowed = [...candidates.cuts]
    .filter((y) => y > contentTop + EPS && y < contentBottom - EPS)
    .filter(
      (y) =>
        candidates.forced.has(y) ||
        !candidates.forbidden.some(([top, bottom]) => y > top + EPS && y < bottom - EPS),
    )
    .sort((a, b) => a - b);
  if (allowed.length === 0) return [page];

  // Merge near-identical cut positions produced by nested aligned edges.
  const boundaries: number[] = [contentTop];
  for (const y of allowed) {
    if (y - (boundaries[boundaries.length - 1] ?? 0) > EPS) boundaries.push(y);
  }
  boundaries.push(Math.max(contentBottom, (boundaries[boundaries.length - 1] ?? 0) + EPS));

  const blocks: PageBlock[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    blocks.push({
      height: (boundaries[i + 1] ?? 0) - (boundaries[i] ?? 0),
      pageBreakBefore: candidates.forced.has(boundaries[i] ?? Number.NaN),
    });
  }

  // Without glue the DP degenerates: every underfull page costs the same
  // capped badness, so any legal split looks optimal. Generous stretch grades
  // underfull pages smoothly; a sliver of shrink absorbs rounding overfill
  // (it intrudes into the bottom padding, never off the page).
  const assignments = breakPages(blocks, {
    pageHeight: usable,
    glueStretch: usable * 0.85,
    glueShrink: usable * 0.02,
  });
  if (assignments.length <= 1) return [page];

  const pages: PageNode[] = [];
  for (let k = 0; k < assignments.length; k++) {
    const a = assignments[k]!;
    // First band opens at the physical page top so full-bleed content above
    // the padding box stays on page one; last band closes past the deepest
    // descendant so nothing is dropped.
    const bandTop = k === 0 ? Math.min(0, contentTop) : (boundaries[a.start] ?? 0);
    const bandBottom =
      k === assignments.length - 1 ? contentBottom + EPS : (boundaries[a.end + 1] ?? 0);
    const dy = k === 0 ? 0 : padTop - bandTop;
    const suffix = k === 0 ? '' : `.p${k}`;

    const children: PdfNode[] = [];
    for (const child of page.children) {
      const sliced = sliceNode(child, geometries, outGeometries, bandTop, bandBottom, dy, suffix);
      if (sliced) children.push(sliced);
    }

    const id = `${page.id}${suffix}`;
    outGeometries.set(id, { ...pageGeo });
    pages.push({ ...page, id, children } as PageNode);
  }
  return pages;
}

/**
 * Expands every overflowing `<Page>` into as many physical pages as its
 * laid-out content needs. Returns the input untouched when everything fits.
 */
export function paginateDocument(
  document: DocumentNode,
  geometries: Map<string, ComputedGeometry>,
): { document: DocumentNode; geometries: Map<string, ComputedGeometry> } {
  let changed = false;
  const outGeometries = new Map(geometries);
  const children: PdfNode[] = [];

  for (const child of document.children) {
    if (child.type !== 'page') {
      children.push(child);
      continue;
    }
    const fragments = paginatePage(child as PageNode, geometries, outGeometries);
    children.push(...fragments);
    if (fragments.length > 1) changed = true;
  }

  if (!changed) return { document, geometries };
  return { document: { ...document, children } as DocumentNode, geometries: outGeometries };
}
