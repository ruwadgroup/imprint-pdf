import type { FontDeclaration } from '@imprint/core';
import type { FontProvider, LoadFontOptions } from './types.js';

export { bunnyProvider } from './providers/bunny.js';
export { fontsourceProvider } from './providers/fontsource.js';
export { googleProvider } from './providers/google.js';
export type { LocalFontFile, LocalProviderOptions } from './providers/local.js';
export { localProvider } from './providers/local.js';
export type { FontProvider, LoadFontOptions } from './types.js';

export function loadFont(
  provider: FontProvider,
  family: string | string[],
  options?: LoadFontOptions,
): Promise<FontDeclaration[]> {
  return provider.load(family, options);
}
