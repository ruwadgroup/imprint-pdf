import type { FontDeclaration } from '@imprint-pdf/core';
import type { FontProvider, LoadFontOptions } from './types.js';

// Ergonomic, zero-config Google Fonts (Fontsource URL scheme).
export type { GoogleFontOptions, GoogleFontStyle, GoogleFontWeight } from './google.js';
export { googleFont } from './google.js';

// Low-level provider loaders — Google, Bunny, Fontsource, and local files.
export { bunnyProvider } from './providers/bunny.js';
export { fontsourceProvider } from './providers/fontsource.js';
export { googleProvider } from './providers/google.js';
export type { LocalFontFile, LocalProviderOptions } from './providers/local.js';
export { localProvider } from './providers/local.js';
export type { FontProvider, LoadFontOptions } from './types.js';

/**
 * Load a font family through a provider, returning `FontDeclaration[]` ready to
 * spread into `imprint.config.ts`'s `fonts` array or pass to `renderToBuffer`.
 */
export function loadFont(
  provider: FontProvider,
  family: string | string[],
  options?: LoadFontOptions,
): Promise<FontDeclaration[]> {
  return provider.load(family, options);
}
