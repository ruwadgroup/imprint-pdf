// Knuth–Plass total-fit line breaking. Builds a graph of feasible breakpoints,
// scores each line by an adjustment ratio (how much the spaces had to stretch
// or shrink), and picks the path with the lowest total demerits. See Knuth &
// Plass, "Breaking Paragraphs into Lines" (1981) for the original treatment.

const INF = 1e9;
// Stretch ratio above this is "very loose" — used to penalise consecutive
// loose lines, which look worse than one loose + one tight.
const VERY_LOOSE = 3;
const LOOSENESS_PENALTY = 10_000;
// Sentinel penalty value forcing a break at this position (paragraph end).
const FORCED = -INF;

interface Box {
  kind: 'box';
  width: number;
  word: string;
}
interface Glue {
  kind: 'glue';
  width: number;
  stretch: number;
  shrink: number;
}
interface Penalty {
  kind: 'penalty';
  width: number;
  penalty: number;
}
type Item = Box | Glue | Penalty;

interface Node {
  position: number;
  line: number;
  demerits: number;
  ratio: number;
  previous: Node | null;
}

// Adjustment ratio: how many units of stretch (positive) or shrink (negative)
// are needed to fit the ideal width into the target. r = 0 means perfect fit.
function ratio(ideal: number, target: number, stretch: number, shrink: number): number {
  const d = target - ideal;
  if (d > 0) return stretch > 0 ? d / stretch : INF;
  if (d < 0) return shrink > 0 ? d / shrink : -INF;
  return 0;
}

// r < -1 means the line would have to shrink past its minimum — infeasible,
// flag with the maximum badness so demerits dominates.
function badness(r: number): number {
  if (r < -1) return 10_000;
  return Math.min(10_000, Math.round(100 * Math.abs(r) ** 3));
}

// Combines line badness with a per-breakpoint penalty. The squaring is from
// the original paper: it keeps demerits monotonic while making one bad line
// much worse than two slightly-bad lines.
function demerits(r: number, p: number, prevRatio: number): number {
  const b = badness(r);
  let d = p >= 0 ? (1 + b + p) ** 2 : p !== FORCED ? (1 + b) ** 2 - p ** 2 : (1 + b) ** 2;
  if (r > VERY_LOOSE && prevRatio > VERY_LOOSE) d += LOOSENESS_PENALTY;
  return d;
}

export function breakLines(
  words: string[],
  spaceWidth: number,
  spaceStretch: number,
  spaceShrink: number,
  lineWidth: number,
  measure: (word: string) => number,
): string[][] {
  if (words.length === 0) return [[]];

  // Build the box/glue/penalty stream described by the algorithm: word, space,
  // word, space, …, then a forced break to terminate the paragraph.
  const items: Item[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === undefined) continue;
    items.push({ kind: 'box', width: measure(w), word: w });
    if (i < words.length - 1) {
      items.push({ kind: 'glue', width: spaceWidth, stretch: spaceStretch, shrink: spaceShrink });
    }
  }
  items.push({ kind: 'penalty', width: 0, penalty: FORCED });

  // Prefix sums let lineMetrics compute width/stretch/shrink between any two
  // breakpoints in O(1) instead of re-scanning the slice each time.
  const n = items.length;
  const sumW = new Float64Array(n + 1);
  const sumS = new Float64Array(n + 1);
  const sumK = new Float64Array(n + 1);

  for (let i = 0; i < n; i++) {
    const it = items[i];
    sumW[i + 1] = (sumW[i] ?? 0) + (it?.width ?? 0);
    if (it?.kind === 'glue') {
      sumS[i + 1] = (sumS[i] ?? 0) + it.stretch;
      sumK[i + 1] = (sumK[i] ?? 0) + it.shrink;
    } else {
      sumS[i + 1] = sumS[i] ?? 0;
      sumK[i + 1] = sumK[i] ?? 0;
    }
  }

  function lineMetrics(from: number, to: number) {
    const start = from + 1;
    let w = (sumW[to] ?? 0) - (sumW[start] ?? 0);
    let s = (sumS[to] ?? 0) - (sumS[start] ?? 0);
    let k = (sumK[to] ?? 0) - (sumK[start] ?? 0);
    // Leading glue at the start of a line collapses (no whitespace at the left
    // margin); subtract it back out.
    const first = start < to ? items[start] : undefined;
    if (first?.kind === 'glue') {
      w -= first.width;
      s -= first.stretch;
      k -= first.shrink;
    }
    // Penalty at the breakpoint contributes its own width (e.g. a hyphen).
    w += items[to]?.width ?? 0;
    return { w, s, k };
  }

  // Each active node represents a feasible breakpoint that we might extend
  // from. The sentinel at position -1 is the start of the paragraph.
  const active: Node[] = [{ position: -1, line: 0, demerits: 0, ratio: 0, previous: null }];
  let best: Node | null = null;

  for (let b = 0; b < n; b++) {
    const item = items[b];
    if (item === undefined) continue;

    // A break can only happen at a penalty (with finite cost) or at a glue
    // immediately following a box — never inside a word.
    const prev = b > 0 ? items[b - 1] : undefined;
    const legal =
      item.kind === 'penalty' ? item.penalty < INF : item.kind === 'glue' && prev?.kind === 'box';
    if (!legal) continue;

    const forced = item.kind === 'penalty' && item.penalty === FORCED;
    const toRemove: number[] = [];
    let localBest: Node | null = null;
    let localD = INF;

    for (let ai = 0; ai < active.length; ai++) {
      const a = active[ai];
      if (a === undefined) continue;
      const { w, s, k } = lineMetrics(a.position, b);
      const r = ratio(w, lineWidth, s, k);
      // Past this breakpoint the line is already too long for any successor
      // to fix — drop it from the active set entirely.
      if (r < -1) {
        toRemove.push(ai);
        continue;
      }
      if (r > VERY_LOOSE && !forced) continue;
      const p = item.kind === 'penalty' ? item.penalty : 0;
      const d = a.demerits + demerits(r, p, a.ratio);
      if (d < localD) {
        localD = d;
        localBest = { position: b, line: a.line + 1, demerits: d, ratio: r, previous: a };
      }
    }

    // Splice from the back so earlier indices stay valid mid-loop.
    for (let ri = toRemove.length - 1; ri >= 0; ri--) {
      const idx = toRemove[ri];
      if (idx !== undefined) active.splice(idx, 1);
    }

    if (localBest !== null) {
      if (forced) {
        if (best === null || localBest.demerits < best.demerits) best = localBest;
      } else {
        active.push(localBest);
      }
    }
  }

  // Single overfull word, container too narrow for any feasible break — fall
  // back to greedy so the caller still gets some output rather than nothing.
  if (best === null) return greedy(words, spaceWidth, lineWidth, measure);

  const breaks: number[] = [];
  let cur: Node | null = best;
  while (cur !== null && cur.position !== -1) {
    breaks.push(cur.position);
    cur = cur.previous;
  }
  breaks.reverse();

  // items[] interleaves boxes (words at even indices) with glues (odd indices),
  // so word index = floor(itemIndex / 2). The break point is at a glue or
  // penalty, both of which sit between two words.
  const lines: string[][] = [];
  let wordStart = 0;
  for (const bp of breaks) {
    const lastBox = items[bp]?.kind === 'penalty' ? bp - 1 : bp - 1;
    const wordEnd = Math.floor(lastBox / 2) + 1;
    lines.push(words.slice(wordStart, wordEnd));
    wordStart = wordEnd;
  }
  if (wordStart < words.length) lines.push(words.slice(wordStart));
  return lines.length > 0 ? lines : [[]];
}

// First-fit fallback used when Knuth–Plass can't find any feasible solution
// (typically because a single word is wider than the column).
function greedy(
  words: string[],
  spaceWidth: number,
  lineWidth: number,
  measure: (word: string) => number,
): string[][] {
  const lines: string[][] = [];
  let cur: string[] = [];
  let w = 0;
  for (const word of words) {
    const ww = measure(word);
    if (cur.length === 0) {
      cur.push(word);
      w = ww;
    } else if (w + spaceWidth + ww <= lineWidth) {
      cur.push(word);
      w += spaceWidth + ww;
    } else {
      lines.push(cur);
      cur = [word];
      w = ww;
    }
  }
  if (cur.length > 0) lines.push(cur);
  return lines.length > 0 ? lines : [[]];
}
