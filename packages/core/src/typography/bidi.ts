// Approximation of UCD DerivedBidiClass.txt strong-RTL characters; covers
// the blocks real-world mixed-direction text actually uses.
const RTL_RANGES: [number, number][] = [
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic
  [0x0700, 0x074f], // Syriac
  [0x0750, 0x077f], // Arabic Supplement
  [0x0780, 0x07bf], // Thaana
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb1d, 0xfb4f], // Hebrew Presentation Forms
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
];

function isRtl(cp: number): boolean {
  for (const [lo, hi] of RTL_RANGES) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

export function hasRtlChars(text: string): boolean {
  for (const ch of text) {
    if (isRtl(ch.codePointAt(0) ?? 0)) return true;
  }
  return false;
}

/** Resolves paragraph direction from the first strong character (UAX #9 P2/P3). */
export function detectBaseDir(text: string): 'ltr' | 'rtl' {
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isRtl(cp)) return 'rtl';
    if (
      (cp >= 0x0041 && cp <= 0x005a) ||
      (cp >= 0x0061 && cp <= 0x007a) ||
      (cp >= 0x00c0 && cp <= 0x02af) ||
      (cp >= 0x0370 && cp <= 0x03ff) ||
      (cp >= 0x0400 && cp <= 0x04ff)
    )
      return 'ltr';
  }
  return 'ltr';
}

interface Run {
  text: string;
  rtl: boolean;
}

// Whitespace is neutral per UAX #9 — keep it on whichever run it follows.
function runs(text: string): Run[] {
  if (!text.length) return [];
  const result: Run[] = [];
  let buf = '';
  let rtl = isRtl(text.codePointAt(0) ?? 0);
  for (const ch of text) {
    if (ch === ' ' || ch === '\t') {
      buf += ch;
      continue;
    }
    const r = isRtl(ch.codePointAt(0) ?? 0);
    if (r !== rtl && buf.length) {
      result.push({ text: buf, rtl });
      buf = ch;
      rtl = r;
    } else buf += ch;
  }
  if (buf.length) result.push({ text: buf, rtl });
  return result;
}

/** Line-level UAX #9 reorder — sufficient for non-nested mixed-direction text. */
export function reorderLine(text: string, baseDir: 'ltr' | 'rtl'): string {
  if (!hasRtlChars(text)) return text;
  const rs = runs(text).map((r) => (r.rtl ? [...r.text].reverse().join('') : r.text));
  if (baseDir === 'rtl') rs.reverse();
  return rs.join('');
}
