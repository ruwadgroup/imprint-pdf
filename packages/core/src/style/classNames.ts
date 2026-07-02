import type { PdfNode } from '../types.js';

// Custom variant prefixes resolved by imprint, not Tailwind (see resolver.ts).
// Tailwind can't compile `page-first:hidden` itself, so the bare utility is
// collected alongside it and the resolver re-attaches the variant.
const IMPRINT_PREFIXES = [
  'page-first:',
  'page-left:',
  'page-right:',
  'imprint-bleed:',
  'imprint-cmyk:',
];

function stripImprintPrefixes(cls: string): string {
  let out = cls;
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const prefix of IMPRINT_PREFIXES) {
      if (out.startsWith(prefix)) {
        out = out.slice(prefix.length);
        stripped = true;
      }
    }
  }
  return out;
}

export function collectClassNames(node: PdfNode, out: Set<string> = new Set()): Set<string> {
  const className = (node.props as Record<string, unknown>).className;
  if (typeof className === 'string' && className.length > 0) {
    for (const cls of className.trim().split(/\s+/)) {
      if (!cls) continue;
      out.add(cls);
      const bare = stripImprintPrefixes(cls);
      if (bare !== cls && bare) out.add(bare);
    }
  }
  for (const child of node.children) {
    collectClassNames(child, out);
  }
  return out;
}
