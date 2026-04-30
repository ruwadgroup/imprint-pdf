import type { PdfNode } from '../types.js';

export function collectClassNames(node: PdfNode, out: Set<string> = new Set()): Set<string> {
  const className = (node.props as Record<string, unknown>).className;
  if (typeof className === 'string' && className.length > 0) {
    for (const cls of className.trim().split(/\s+/)) {
      if (cls) out.add(cls);
    }
  }
  for (const child of node.children) {
    collectClassNames(child, out);
  }
  return out;
}
