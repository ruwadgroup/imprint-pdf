// Plass total-fit page breaking: same DP shape as Knuth–Plass, but each
// "line" is a block and the "line width" is the page height.
// Plass, "Optimal Pagination Techniques for Automatic Typesetting Systems", 1981.

const INF = 1e9;
const ORPHAN_PENALTY = 150;
const FORCED = -INF;

export interface PageBlock {
  /** Natural height in points. */
  height: number;
  /** Forbids a page break directly after this block. */
  keepWithNext?: boolean;
  /** Forbids a page break directly before this block. */
  keepWithPrev?: boolean;
  /** Forces a page break before this block. */
  pageBreakBefore?: boolean;
  /** Line count, used for widow/orphan detection. */
  lines?: number;
}

export interface BreakPagesOptions {
  pageHeight: number;
  glueStretch?: number;
  glueShrink?: number;
}

export interface PageAssignment {
  /** Inclusive block indices. */
  start: number;
  end: number;
  used: number;
  /** Glue adjustment ratio — positive stretches, negative compresses. */
  ratio: number;
}

interface ActiveNode {
  position: number;
  page: number;
  demerits: number;
  ratio: number;
  previous: ActiveNode | null;
}

function adjustmentRatio(used: number, target: number, stretch: number, shrink: number): number {
  const d = target - used;
  if (d > 0) return stretch > 0 ? d / stretch : INF;
  if (d < 0) return shrink > 0 ? d / shrink : -INF;
  return 0;
}

function badness(r: number): number {
  if (r < -1) return 10_000;
  // No rounding: near-fit ratios must still order, or every "almost full"
  // page collapses to badness 0 and the DP breaks ties arbitrarily early.
  return Math.min(10_000, 100 * Math.abs(r) ** 3);
}

function pageDemerits(r: number, p: number, widowOrphan: number): number {
  const b = badness(r);
  const base = p >= 0 ? (1 + b + p) ** 2 : p !== FORCED ? (1 + b) ** 2 - p ** 2 : (1 + b) ** 2;
  return base + widowOrphan;
}

// Splits blocks across pages using Plass total-fit. Falls back to greedy
// first-fit when no DP solution exists (e.g. a single block taller than a page).
export function breakPages(blocks: PageBlock[], options: BreakPagesOptions): PageAssignment[] {
  if (blocks.length === 0) return [];

  const { pageHeight } = options;
  const stretch = options.glueStretch ?? 0;
  const shrink = options.glueShrink ?? 0;

  const cum = new Float64Array(blocks.length + 1);
  for (let i = 0; i < blocks.length; i++) {
    cum[i + 1] = (cum[i] ?? 0) + blocks[i]!.height;
  }

  const active: ActiveNode[] = [{ position: -1, page: 0, demerits: 0, ratio: 0, previous: null }];
  // TS narrows `let best = null` to `null` and refuses to widen on assignment.
  let best = null as ActiveNode | null;

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b]!;
    const next = blocks[b + 1];
    const forced = next?.pageBreakBefore === true;
    const lastBlock = b === blocks.length - 1;
    const legal =
      lastBlock ||
      forced ||
      (block.keepWithNext !== true && (next === undefined || next.keepWithPrev !== true));
    if (!legal && !lastBlock) continue;

    let localBest: ActiveNode | null = null;
    let localD = INF;

    for (let ai = 0; ai < active.length; ai++) {
      const a = active[ai]!;
      const used = (cum[b + 1] ?? 0) - (cum[a.position + 1] ?? 0);
      const r = adjustmentRatio(used, pageHeight, stretch, shrink);
      if (r < -1) {
        active.splice(ai, 1);
        ai--;
        continue;
      }

      let widowOrphan = 0;
      if (block.lines !== undefined && block.lines >= 2) {
        const startBlock = blocks[a.position + 1];
        if (startBlock?.lines !== undefined && startBlock.lines >= 2 && a.position + 1 === b) {
          widowOrphan += ORPHAN_PENALTY;
        }
      }

      const p = lastBlock || forced ? FORCED : 0;
      // Ragged bottom: a forced/final break never pays for being underfull,
      // so earlier pages fill up instead of spreading content evenly.
      const rEff = p === FORCED && r > 0 ? 0 : r;
      const d = a.demerits + pageDemerits(rEff, p, widowOrphan);
      if (d < localD) {
        localD = d;
        localBest = { position: b, page: a.page + 1, demerits: d, ratio: r, previous: a };
      }
    }

    if (localBest === null) continue;
    if (lastBlock) {
      if (!best || localBest.demerits < best.demerits) best = localBest;
      break;
    }
    if (forced) active.length = 0;
    active.push(localBest);
  }

  if (best === null) return greedy(blocks, pageHeight);

  const stack: ActiveNode[] = [];
  let cur: ActiveNode | null = best;
  while (cur !== null && cur.position !== -1) {
    stack.push(cur);
    cur = cur.previous;
  }
  stack.reverse();

  const pages: PageAssignment[] = [];
  let start = 0;
  for (const node of stack) {
    const used = (cum[node.position + 1] ?? 0) - (cum[start] ?? 0);
    pages.push({ start, end: node.position, used, ratio: node.ratio });
    start = node.position + 1;
  }
  return pages;
}

function greedy(blocks: PageBlock[], pageHeight: number): PageAssignment[] {
  const pages: PageAssignment[] = [];
  let start = 0;
  let used = 0;
  for (let i = 0; i < blocks.length; i++) {
    const h = blocks[i]!.height;
    if (used > 0 && used + h > pageHeight) {
      pages.push({ start, end: i - 1, used, ratio: 0 });
      start = i;
      used = h;
    } else {
      used += h;
    }
  }
  if (start < blocks.length) {
    pages.push({ start, end: blocks.length - 1, used, ratio: 0 });
  }
  return pages;
}
