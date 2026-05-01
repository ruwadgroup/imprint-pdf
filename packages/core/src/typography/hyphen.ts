// Set by the renderer before layout, cleared after, so layout and draw
// share one hyphenator without core depending on `@imprint/font/hyphen`.
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
