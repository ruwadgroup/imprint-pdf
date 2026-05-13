// Module-level slot so layout and draw share one hyphenator without core
// taking a hard dep on `@imprint-pdf/font/hyphen`. The renderer sets it
// before layout and clears it after.
let _hyphenate: ((word: string) => string[]) | null = null;

export function setHyphenator(fn: (word: string) => string[]): void {
  _hyphenate = fn;
}

export function clearHyphenator(): void {
  _hyphenate = null;
}

export function getHyphenator(): ((word: string) => string[]) | null {
  return _hyphenate;
}
