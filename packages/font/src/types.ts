import type { FontDeclaration } from '@imprint/core';

export interface LoadFontOptions {
  weights?: number[];
  styles?: ('normal' | 'italic')[];
  display?: string;
  fetch?: typeof globalThis.fetch;
  // Variable-axis ranges as `[min, max]`. Providers that don't support VF
  // (Fontsource, local) ignore.
  axes?: Record<string, [number, number]>;
}

export interface FontProvider {
  readonly name: string;
  load(family: string | string[], options?: LoadFontOptions): Promise<FontDeclaration[]>;
}
