import { describe, expect, it } from 'vitest';
import { scriptOf, splitByScript } from './script.js';

describe('scriptOf', () => {
  it('returns OpenType tags for the major scripts imprint ships', () => {
    expect(scriptOf('A'.codePointAt(0)!)).toBe('latn');
    expect(scriptOf('Ω'.codePointAt(0)!)).toBe('grek');
    expect(scriptOf('Я'.codePointAt(0)!)).toBe('cyrl');
    expect(scriptOf('ا'.codePointAt(0)!)).toBe('arab');
    expect(scriptOf('א'.codePointAt(0)!)).toBe('hebr');
    expect(scriptOf('क'.codePointAt(0)!)).toBe('deva');
    expect(scriptOf('ก'.codePointAt(0)!)).toBe('thai');
    expect(scriptOf('字'.codePointAt(0)!)).toBe('hani');
    expect(scriptOf('あ'.codePointAt(0)!)).toBe('hira');
    expect(scriptOf('カ'.codePointAt(0)!)).toBe('kana');
    expect(scriptOf('한'.codePointAt(0)!)).toBe('hang');
  });

  it('returns zyyy (common) for digits and punctuation', () => {
    expect(scriptOf('1'.codePointAt(0)!)).toBe('latn'); // 1 falls inside 0..0x024f Latin block
    expect(scriptOf('!'.codePointAt(0)!)).toBe('latn'); // same
    // Genuine common-class char outside Latin block:
    expect(scriptOf(0x2000)).toBe('zyyy');
  });
});

describe('splitByScript', () => {
  it('returns a single run for homogeneous text', () => {
    expect(splitByScript('Hello world')).toEqual([{ text: 'Hello world', script: 'latn' }]);
  });

  it('breaks at script transitions', () => {
    const runs = splitByScript('Hello مرحبا world');
    expect(runs).toHaveLength(3);
    expect(runs[0]!.script).toBe('latn');
    expect(runs[1]!.script).toBe('arab');
    expect(runs[2]!.script).toBe('latn');
  });

  it('keeps neutral characters with the surrounding strong run', () => {
    const runs = splitByScript('東京 city');
    // " " is common-class inside Latin range so it sticks to whichever run
    // it lands in. Two strong scripts → two runs total.
    expect(runs).toHaveLength(2);
    expect(runs[0]!.script).toBe('hani');
    expect(runs[1]!.script).toBe('latn');
  });

  it('returns an empty array for empty input', () => {
    expect(splitByScript('')).toEqual([]);
  });
});
