import { describe, expect, it } from 'vitest';
import { resolveOptionalPt, resolvePt } from './units.js';

describe('resolvePt', () => {
  it('returns base for undefined', () => {
    expect(resolvePt(undefined, 100)).toBe(100);
  });

  it('converts px', () => {
    expect(resolvePt('12px', 0)).toBeCloseTo(9);
  });

  it('converts pt', () => {
    expect(resolvePt('10pt', 0)).toBe(10);
  });

  it('converts mm', () => {
    expect(resolvePt('10mm', 0)).toBeCloseTo(28.346, 1);
  });

  it('converts %', () => {
    expect(resolvePt('50%', 200)).toBe(100);
  });

  it('handles bare number', () => {
    expect(resolvePt(20, 0)).toBe(20);
  });

  it('handles numeric string', () => {
    expect(resolvePt('16', 0)).toBe(16);
  });
});

describe('resolveOptionalPt', () => {
  it('returns undefined for undefined input', () => {
    expect(resolveOptionalPt(undefined)).toBeUndefined();
  });

  it('resolves defined value', () => {
    expect(resolveOptionalPt('8px')).toBeCloseTo(6);
  });
});
