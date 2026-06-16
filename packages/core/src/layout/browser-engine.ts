import type { ComputedGeometry, PdfNode } from '../types.js';
import type { LoadedFont } from '../typography/font-common.js';
import { runSimpleLayout } from './simple-layout.js';

export async function runLayout(
  node: PdfNode,
  containerWidth: number,
  containerHeight: number,
  fontMetrics: Map<string, LoadedFont> = new Map(),
): Promise<Map<string, ComputedGeometry>> {
  return runSimpleLayout(node, containerWidth, containerHeight, fontMetrics);
}
