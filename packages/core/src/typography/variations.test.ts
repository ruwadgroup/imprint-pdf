import { describe, expect, it } from 'vitest';
import { deriveAxesFromStyle, parseVariationSettings } from './variations.js';

describe('parseVariationSettings', () => {
  it('parses the canonical CSS form into a tag→value record', () => {
    expect(parseVariationSettings('"wght" 700, "wdth" 80')).toEqual({ wght: 700, wdth: 80 });
  });

  it('handles negative and fractional values', () => {
    expect(parseVariationSettings('"slnt" -10, "opsz" 12.5')).toEqual({ slnt: -10, opsz: 12.5 });
  });

  it('returns an empty object for `normal` and undefined', () => {
    expect(parseVariationSettings(undefined)).toEqual({});
    expect(parseVariationSettings('normal')).toEqual({});
  });
});

describe('deriveAxesFromStyle', () => {
  it('lifts numeric font-weight onto the wght axis', () => {
    expect(deriveAxesFromStyle({ fontWeight: 600 })).toEqual({ wght: 600 });
  });

  it('lifts named font-stretch values onto the wdth axis', () => {
    expect(deriveAxesFromStyle({ fontStretch: 'condensed' })).toEqual({ wdth: 75 });
    expect(deriveAxesFromStyle({ fontStretch: 'extra-expanded' })).toEqual({ wdth: 150 });
  });

  it('honors percentage font-stretch values', () => {
    expect(deriveAxesFromStyle({ fontStretch: '90%' })).toEqual({ wdth: 90 });
  });

  it('explicit fontVariationSettings wins over derived axes', () => {
    expect(deriveAxesFromStyle({ fontVariationSettings: '"wght" 800', fontWeight: 400 })).toEqual({
      wght: 800,
    });
  });

  it('combines variation settings with derived stretch', () => {
    expect(deriveAxesFromStyle({ fontVariationSettings: '"opsz" 14', fontWeight: 500 })).toEqual({
      opsz: 14,
      wght: 500,
    });
  });
});
