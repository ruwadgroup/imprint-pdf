import { describe, expect, it } from 'vitest';
import { HYPHEN_LANGUAGES, hyphenate, loadHyphenator, registerHyphenator } from './index.js';
import { compileHyphenator } from './liang.js';

describe('Liang algorithm — bundled patterns', () => {
  it('hyphenates English words at sensible breakpoints', () => {
    // Spot-check classic Liang fixtures from the original 1983 thesis.
    expect(hyphenate('hyphenation', 'en-us')).toEqual(['hy', 'phen', 'ation']);
    expect(hyphenate('algorithm', 'en-us')).toEqual(['al', 'go', 'rithm']);
    expect(hyphenate('justification', 'en-us')).toEqual(['jus', 'ti', 'fi', 'ca', 'tion']);
    expect(hyphenate('paragraph', 'en-us')).toEqual(['para', 'graph']);
  });

  it('honors leftmin / rightmin so fragments stay legible', () => {
    // 'a' alone is too short to be a leftmin segment in any language we ship.
    expect(hyphenate('atom', 'en-us')[0]!.length).toBeGreaterThanOrEqual(2);
  });

  it('returns the original word when it is shorter than leftmin + rightmin', () => {
    expect(hyphenate('cat', 'en-us')).toEqual(['cat']);
    expect(hyphenate('the', 'en-us')).toEqual(['the']);
  });

  it('hyphenates German with German patterns', () => {
    // Classic German hyphenation: Schiff-fahrt, Schwimm-bad, etc.
    const parts = hyphenate('Computeranwendung', 'de');
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join('')).toBe('Computeranwendung');
  });

  it('preserves case in the returned syllables', () => {
    expect(hyphenate('Hyphenation', 'en-us').join('')).toBe('Hyphenation');
  });

  it('caches compiled hyphenators between calls', () => {
    const a = loadHyphenator('en-us');
    const b = loadHyphenator('en-us');
    expect(a).toBe(b);
  });

  it('throws a clear error for an unknown language', () => {
    expect(() => loadHyphenator('xx-yy')).toThrow(/no hyphenation patterns bundled/);
  });

  it('exposes all 12 roadmap languages', () => {
    // Order is alphabetical because the list is codegen'd from filenames in
    // data/hyphen/. Compare as sets so the assertion isn't fragile.
    expect([...HYPHEN_LANGUAGES].sort()).toEqual(
      ['da', 'de', 'en-gb', 'en-us', 'es', 'fi', 'fr', 'it', 'nb', 'nl', 'pt', 'sv'].sort(),
    );
    for (const lang of HYPHEN_LANGUAGES) {
      const h = loadHyphenator(lang);
      expect(h.id).toBeTruthy();
      expect(typeof h.hyphenate).toBe('function');
    }
  });

  it('lets users register additional pattern packs at runtime', () => {
    // Toy patterns: break before every 'a' that isn't word-initial.
    const h = registerHyphenator({
      id: 'tiny',
      leftmin: 1,
      rightmin: 1,
      patterns: { 2: '1a' },
    });
    // The pattern ".1a" would be the word-anchored form; with just "1a"
    // it can also fire before any 'a' — including the first char — but
    // leftmin=1 prevents the leading break.
    expect(h.hyphenate('banana')).toEqual(['b', 'an', 'an', 'a']);
  });

  it('compileHyphenator handles exceptions overriding patterns', () => {
    const h = compileHyphenator({
      id: 'override',
      leftmin: 2,
      rightmin: 2,
      patterns: {},
      exceptions: 'as-so-ciate as-so-ciates',
    });
    expect(h.hyphenate('associate')).toEqual(['as', 'so', 'ciate']);
    expect(h.hyphenate('associates')).toEqual(['as', 'so', 'ciates']);
  });
});
