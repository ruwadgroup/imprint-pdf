/** ISO 15924 OpenType script tag, passed to HarfBuzz for GSUB selection. */
export type ScriptTag =
  | 'latn'
  | 'grek'
  | 'cyrl'
  | 'arab'
  | 'hebr'
  | 'deva'
  | 'thai'
  | 'hani'
  | 'hira'
  | 'kana'
  | 'hang'
  | 'zyyy';

interface Range {
  lo: number;
  hi: number;
  tag: ScriptTag;
}

// Ordered by frequency — the Latin range comes first so common text exits early.
const RANGES: Range[] = [
  { lo: 0x0000, hi: 0x024f, tag: 'latn' },
  { lo: 0x0370, hi: 0x03ff, tag: 'grek' },
  { lo: 0x0400, hi: 0x04ff, tag: 'cyrl' },
  { lo: 0x0500, hi: 0x052f, tag: 'cyrl' },
  { lo: 0x0590, hi: 0x05ff, tag: 'hebr' },
  { lo: 0x0600, hi: 0x06ff, tag: 'arab' },
  { lo: 0x0750, hi: 0x077f, tag: 'arab' },
  { lo: 0x0900, hi: 0x097f, tag: 'deva' },
  { lo: 0x0e00, hi: 0x0e7f, tag: 'thai' },
  { lo: 0x1100, hi: 0x11ff, tag: 'hang' },
  { lo: 0x3040, hi: 0x309f, tag: 'hira' },
  { lo: 0x30a0, hi: 0x30ff, tag: 'kana' },
  { lo: 0x3130, hi: 0x318f, tag: 'hang' },
  { lo: 0x31f0, hi: 0x31ff, tag: 'kana' },
  { lo: 0x3400, hi: 0x4dbf, tag: 'hani' },
  { lo: 0x4e00, hi: 0x9fff, tag: 'hani' },
  { lo: 0xa960, hi: 0xa97f, tag: 'hang' },
  { lo: 0xac00, hi: 0xd7af, tag: 'hang' },
  { lo: 0xfb1d, hi: 0xfb4f, tag: 'hebr' },
  { lo: 0xfb50, hi: 0xfdff, tag: 'arab' },
  { lo: 0xfe70, hi: 0xfeff, tag: 'arab' },
  { lo: 0xff00, hi: 0xff60, tag: 'latn' },
  { lo: 0xff61, hi: 0xff9f, tag: 'kana' },
  { lo: 0x20000, hi: 0x2ffff, tag: 'hani' },
];

export function scriptOf(codePoint: number): ScriptTag {
  for (const r of RANGES) {
    if (codePoint >= r.lo && codePoint <= r.hi) return r.tag;
  }
  return 'zyyy';
}

export interface ScriptRun {
  text: string;
  script: ScriptTag;
}

// Splits `text` into contiguous-script runs. Common-class chars (digits,
// punctuation, whitespace) inherit the surrounding script — matches Uniscribe /
// DWrite, and keeps the shaper down to one call per visible script.
export function splitByScript(text: string): ScriptRun[] {
  if (!text.length) return [];
  const result: ScriptRun[] = [];
  let buf = '';
  let cur: ScriptTag | null = null;

  for (const ch of text) {
    const sc = scriptOf(ch.codePointAt(0) ?? 0);
    if (sc === 'zyyy' || sc === cur) {
      buf += ch;
    } else if (cur === null) {
      cur = sc;
      buf += ch;
    } else {
      result.push({ text: buf, script: cur });
      buf = ch;
      cur = sc;
    }
  }
  if (buf.length) result.push({ text: buf, script: cur ?? 'latn' });
  return result;
}
