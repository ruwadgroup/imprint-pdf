import type { ComputedGeometry, PdfNode } from '../types.js';
import type { LoadedFont } from '../typography/fonts.js';
import { runTaffyLayout } from './taffy-adapter.js';

export async function runLayout(
  node: PdfNode,
  containerWidth: number,
  containerHeight: number,
  fontMetrics: Map<string, LoadedFont> = new Map(),
): Promise<Map<string, ComputedGeometry>> {
  return runTaffyLayout(node, containerWidth, containerHeight, fontMetrics);
}
