import type { ComputedGeometry, PdfNode } from '../types.js';
import type { LoadedFont } from '../typography/fonts.js';

const isNode =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.node !== 'undefined';

export async function runLayout(
  node: PdfNode,
  containerWidth: number,
  containerHeight: number,
  fontMetrics: Map<string, LoadedFont> = new Map(),
): Promise<Map<string, ComputedGeometry>> {
  if (isNode) {
    const { runTaffyLayout } = await import('./taffy-adapter.js');
    return runTaffyLayout(node, containerWidth, containerHeight, fontMetrics);
  }
  const { runSimpleLayout } = await import('./simple-layout.js');
  return runSimpleLayout(node, containerWidth, containerHeight, fontMetrics);
}
