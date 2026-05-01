// Liang, "Word Hy-phen-a-tion by Com-put-er" (1983). Odd scores mark legal breakpoints.

/** Pattern blob in Hypher's `length → concatenated patterns` format. */
export interface HyphenPatternData {
  id: string;
  leftmin: number;
  rightmin: number;
  patterns: Record<string, string>;
  exceptions?: string | string[] | null;
}

interface Trie {
  [ch: string]: Trie | Int8Array | undefined;
  _?: Int8Array;
}

const PATTERN_KEY = '_' as const;

function compileTrie(data: HyphenPatternData): Trie {
  const root: Trie = {};
  for (const [lenStr, blob] of Object.entries(data.patterns)) {
    const len = parseInt(lenStr, 10);
    for (let off = 0; off < blob.length; off += len) {
      insertPattern(root, blob.slice(off, off + len));
    }
  }
  return root;
}

function insertPattern(root: Trie, pattern: string): void {
  // "a1bc2" → chars=[a,b,c], scores=[0,1,0,0,2]. Each digit binds to the slot
  // before the next character.
  const chars: string[] = [];
  const scores: number[] = [];
  let pendingScore = 0;
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      pendingScore = code - 48;
    } else {
      chars.push(ch);
      scores.push(pendingScore);
      pendingScore = 0;
    }
  }
  scores.push(pendingScore);

  let node = root;
  for (const ch of chars) {
    const next = node[ch];
    if (next instanceof Int8Array) {
      // Promote a leaf so a later interior insert at the same prefix doesn't
      // overwrite it. (Hypher's bundled data doesn't trigger this in practice.)
      const promoted: Trie = { _: next };
      node[ch] = promoted;
      node = promoted;
    } else if (next === undefined) {
      const created: Trie = {};
      node[ch] = created;
      node = created;
    } else {
      node = next;
    }
  }
  node[PATTERN_KEY] = Int8Array.from(scores);
}

export interface CompiledHyphenator {
  id: string;
  leftmin: number;
  rightmin: number;
  hyphenate(word: string): string[];
}

export function compileHyphenator(data: HyphenPatternData): CompiledHyphenator {
  const trie = compileTrie(data);

  const exceptions = new Map<string, Int8Array>();
  if (data.exceptions) {
    const list = Array.isArray(data.exceptions) ? data.exceptions : data.exceptions.split(/\s+/);
    for (const raw of list) {
      if (!raw) continue;
      const word = raw.replace(/-/g, '');
      const scores = new Int8Array(word.length + 1);
      let i = 0;
      for (const ch of raw) {
        if (ch === '-') {
          if (i > 0 && i <= word.length) scores[i] = 1;
        } else {
          i++;
        }
      }
      exceptions.set(word.toLowerCase(), scores);
    }
  }

  function hyphenate(word: string): string[] {
    if (word.length < data.leftmin + data.rightmin) return [word];

    const lower = word.toLowerCase();
    const exception = exceptions.get(lower);
    if (exception) return splitByScores(word, exception, data.leftmin, data.rightmin);

    // `.` boundaries let patterns anchor to start-of-word (".ach") or end ("ing.").
    const padded = `.${lower}.`;
    const scores = new Int8Array(padded.length + 1);
    for (let i = 0; i < padded.length; i++) {
      let node: Trie = trie;
      for (let j = i; j < padded.length; j++) {
        const next: Trie | Int8Array | undefined = node[padded[j]!];
        if (next === undefined) break;
        if (next instanceof Int8Array) {
          mergeScores(scores, next, i);
          break;
        }
        node = next;
        const leaf = node[PATTERN_KEY];
        if (leaf) mergeScores(scores, leaf, i);
      }
    }

    const wordScores = scores.slice(1, scores.length - 1);
    return splitByScores(word, wordScores, data.leftmin, data.rightmin);
  }

  return { id: data.id, leftmin: data.leftmin, rightmin: data.rightmin, hyphenate };
}

function mergeScores(target: Int8Array, source: Int8Array, offset: number): void {
  for (let i = 0; i < source.length; i++) {
    const idx = offset + i;
    if (idx >= target.length) break;
    const v = source[i]!;
    if (v > target[idx]!) target[idx] = v;
  }
}

function splitByScores(
  word: string,
  scores: Int8Array,
  leftmin: number,
  rightmin: number,
): string[] {
  const parts: string[] = [];
  let start = 0;
  for (let i = leftmin; i <= word.length - rightmin; i++) {
    const s = scores[i];
    if (s !== undefined && s % 2 === 1) {
      parts.push(word.slice(start, i));
      start = i;
    }
  }
  parts.push(word.slice(start));
  return parts;
}
