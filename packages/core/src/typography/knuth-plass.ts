// Knuth & Plass, "Breaking Paragraphs into Lines" (1981).

const INF = 1e9;
const VERY_LOOSE = 3;
const LOOSENESS_PENALTY = 10_000;
const FORCED = -INF;
const HYPHEN_PENALTY = 50;

interface Box {
  kind: 'box';
  width: number;
  word: number;
  syll: number;
  text: string;
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
  hyphen?: boolean;
}
type Item = Box | Glue | Penalty;

interface Node {
  position: number;
  line: number;
  demerits: number;
  ratio: number;
  previous: Node | null;
}

function ratio(ideal: number, target: number, stretch: number, shrink: number): number {
  const d = target - ideal;
  if (d > 0) return stretch > 0 ? d / stretch : INF;
  if (d < 0) return shrink > 0 ? d / shrink : -INF;
  return 0;
}

function badness(r: number): number {
  if (r < -1) return 10_000;
  return Math.min(10_000, Math.round(100 * Math.abs(r) ** 3));
}

function demerits(r: number, p: number, prevRatio: number): number {
  const b = badness(r);
  let d = p >= 0 ? (1 + b + p) ** 2 : p !== FORCED ? (1 + b) ** 2 - p ** 2 : (1 + b) ** 2;
  if (r > VERY_LOOSE && prevRatio > VERY_LOOSE) d += LOOSENESS_PENALTY;
  return d;
}

export interface BreakLinesOptions {
  hyphenate?: (word: string) => string[];
}

export function breakLines(
  words: string[],
  spaceWidth: number,
  spaceStretch: number,
  spaceShrink: number,
  lineWidth: number,
  measure: (word: string) => number,
  options: BreakLinesOptions = {},
): string[][] {
  if (words.length === 0) return [[]];

  const hyphenWidth = options.hyphenate ? measure('-') : 0;

  const items: Item[] = [];
  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi];
    if (word === undefined) continue;
    const syllables = options.hyphenate ? options.hyphenate(word) : [word];
    for (let si = 0; si < syllables.length; si++) {
      const syl = syllables[si]!;
      items.push({ kind: 'box', width: measure(syl), word: wi, syll: si, text: syl });
      if (si < syllables.length - 1) {
        items.push({ kind: 'penalty', width: hyphenWidth, penalty: HYPHEN_PENALTY, hyphen: true });
      }
    }
    if (wi < words.length - 1) {
      items.push({ kind: 'glue', width: spaceWidth, stretch: spaceStretch, shrink: spaceShrink });
    }
  }
  items.push({ kind: 'penalty', width: 0, penalty: FORCED });

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
    // Leading glue collapses at the left margin.
    const first = start < to ? items[start] : undefined;
    if (first?.kind === 'glue') {
      w -= first.width;
      s -= first.stretch;
      k -= first.shrink;
    }
    // Trailing penalty (e.g. hyphen glyph) contributes its width.
    w += items[to]?.width ?? 0;
    return { w, s, k };
  }

  const active: Node[] = [{ position: -1, line: 0, demerits: 0, ratio: 0, previous: null }];
  let best: Node | null = null;

  for (let b = 0; b < n; b++) {
    const item = items[b];
    if (item === undefined) continue;

    // Legal breakpoints: penalties, or glue after a box. Never inside a syllable.
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

  if (best === null) return greedy(words, spaceWidth, lineWidth, measure);

  const breaks: number[] = [];
  let cur: Node | null = best;
  while (cur !== null && cur.position !== -1) {
    breaks.push(cur.position);
    cur = cur.previous;
  }
  breaks.reverse();

  return assembleLines(items, breaks);
}

function assembleLines(items: Item[], breaks: number[]): string[][] {
  const lines: string[][] = [];
  let cursor = 0;

  for (const bp of breaks) {
    const line: string[] = [];
    let acc = '';
    let accWord = -1;

    for (let i = cursor; i <= bp; i++) {
      const it = items[i];
      if (!it) continue;
      if (it.kind === 'box') {
        if (it.word !== accWord && acc) line.push(acc);
        acc = it.word === accWord ? acc + it.text : it.text;
        accWord = it.word;
      } else if (it.kind === 'glue') {
        if (acc) {
          line.push(acc);
          acc = '';
          accWord = -1;
        }
      } else if (it.kind === 'penalty') {
        if (i === bp && it.hyphen) acc += '-';
      }
    }
    if (acc) line.push(acc);
    lines.push(line);
    cursor = bp + 1;
  }

  return lines.length > 0 ? lines : [[]];
}

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
