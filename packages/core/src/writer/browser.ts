import { runLayout } from '../layout/browser-engine.js';
import type { AssetResolver, ComputedGeometry, DocumentNode, FontDeclaration } from '../types.js';
import { loadFonts } from '../typography/fonts-browser.js';
import { type WritePdfOptions, writePdfWith } from './shared.js';

export type { WritePdfOptions } from './shared.js';

export function writePdf(
  document: DocumentNode,
  geometries: Map<string, ComputedGeometry>,
  fontDeclarations: FontDeclaration[],
  resolver: AssetResolver,
  options: WritePdfOptions = {},
): Promise<Uint8Array> {
  return writePdfWith(
    { loadFonts, runLayout },
    document,
    geometries,
    fontDeclarations,
    resolver,
    options,
  );
}
