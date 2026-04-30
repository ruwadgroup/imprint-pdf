import { afterEach, describe, expect, it } from 'vitest';
import type { ResolvedStyle } from '../types.js';
import {
  clearCompiledClassMap,
  mergeStyles,
  resolveClassName,
  resolveStyles,
  setCompiledClassMap,
} from './resolver.js';

describe('resolveClassName — compiled map', () => {
  afterEach(() => {
    clearCompiledClassMap();
  });

  it('returns empty object when no compiled map is set', () => {
    expect(resolveClassName('flex')).toEqual({});
    expect(resolveClassName('font-bold px-4')).toEqual({});
  });

  it('returns empty object for unknown classes even with a compiled map', () => {
    setCompiledClassMap(new Map([['text-primary', { color: '#ff0000' }]]));
    expect(resolveClassName('font-bold')).toEqual({});
  });

  it('resolves a single class from the compiled map', () => {
    setCompiledClassMap(new Map([['text-primary', { color: '#ff0000' }]]));
    expect(resolveClassName('text-primary')).toMatchObject({ color: '#ff0000' });
  });

  it('merges multiple compiled classes left-to-right', () => {
    const map = new Map<string, ResolvedStyle>([
      ['text-primary', { color: '#ff0000' }],
      ['bg-surface', { backgroundColor: '#f0f0f0' }],
    ]);
    setCompiledClassMap(map);
    const r = resolveClassName('text-primary bg-surface');
    expect(r).toMatchObject({ color: '#ff0000', backgroundColor: '#f0f0f0' });
  });

  it('later classes overwrite earlier ones for the same property', () => {
    const map = new Map<string, ResolvedStyle>([
      ['text-red', { color: 'red' }],
      ['text-blue', { color: 'blue' }],
    ]);
    setCompiledClassMap(map);
    expect(resolveClassName('text-red text-blue').color).toBe('blue');
  });

  it('strips responsive and state prefixes before lookup', () => {
    setCompiledClassMap(new Map([['flex', { display: 'flex' }]]));
    const r = resolveClassName('sm:flex md:flex');
    expect(r).toMatchObject({ display: 'flex' });
  });

  it('clearCompiledClassMap causes resolution to return empty', () => {
    setCompiledClassMap(new Map([['flex', { display: 'grid' as const }]]));
    clearCompiledClassMap();
    expect(resolveClassName('flex')).toEqual({});
  });
});

describe('mergeStyles', () => {
  it('overrides base with defined values in override', () => {
    const base: ResolvedStyle = { color: 'red', fontWeight: 400 };
    const override: ResolvedStyle = { color: 'blue' };
    expect(mergeStyles(base, override)).toMatchObject({ color: 'blue', fontWeight: 400 });
  });

  it('preserves base when override omits property', () => {
    const base: ResolvedStyle = { color: 'red' };
    const override: ResolvedStyle = {};
    expect(mergeStyles(base, override).color).toBe('red');
  });
});

describe('resolveStyles', () => {
  afterEach(() => {
    clearCompiledClassMap();
  });

  it('inline style takes precedence over compiled className', () => {
    setCompiledClassMap(new Map([['font-bold', { fontWeight: 700 }]]));
    const r = resolveStyles('font-bold', { fontWeight: 300 });
    expect(r.fontWeight).toBe(300);
  });

  it('returns compiled className styles when no inline style is given', () => {
    setCompiledClassMap(new Map([['font-bold', { fontWeight: 700 }]]));
    expect(resolveStyles('font-bold').fontWeight).toBe(700);
  });

  it('returns empty object when both args omitted', () => {
    expect(resolveStyles()).toEqual({});
  });

  it('returns only inline style when className has no compiled entry', () => {
    const r = resolveStyles('font-bold', { fontWeight: 300 });
    expect(r).toEqual({ fontWeight: 300 });
  });
});
