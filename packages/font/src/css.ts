import type { FontDeclaration } from '@imprint/core';

// Google Fonts and Bunny Fonts emit one `@font-face` per unicode-range
// subset, with `latin` always last. The last block per (family,weight,style)
// wins because it's the one we actually want to embed.
export function parseFontFaces(css: string): FontDeclaration[] {
  const last = new Map<string, FontDeclaration>();
  const re = /@font-face\s*\{([^}]+)\}/g;
  let m = re.exec(css);
  while (m !== null) {
    const decl = parseFontFaceBlock(m[1]!);
    if (decl) {
      last.set(`${decl.family}:${decl.weight ?? 400}:${decl.style ?? 'normal'}`, decl);
    }
    m = re.exec(css);
  }
  return [...last.values()];
}

function parseFontFaceBlock(block: string): FontDeclaration | null {
  const prop = (name: string): string | undefined => {
    const r = new RegExp(`${name}\\s*:\\s*([^;]+)`, 'i');
    return r.exec(block)?.[1]?.trim();
  };

  const family = prop('font-family')?.replace(/^['"]|['"]$/g, '');
  if (!family) return null;

  const weightStr = prop('font-weight');
  const weight = weightStr ? parseInt(weightStr, 10) : 400;
  if (Number.isNaN(weight)) return null;

  const styleStr = prop('font-style');
  const style: 'normal' | 'italic' = styleStr === 'italic' ? 'italic' : 'normal';

  const srcStr = prop('src');
  if (!srcStr) return null;

  const urlMatch = /url\((['"]?)([^)'"]+)\1\)/.exec(srcStr);
  if (!urlMatch) return null;
  const src = urlMatch[2]!;

  const fmtMatch = /format\(['"]([^'"]+)['"]\)/.exec(srcStr);
  const format = fmtMatch?.[1] as FontDeclaration['format'] | undefined;

  return { family, src, weight, style, ...(format ? { format } : {}) };
}

export function buildFamilyParam(
  family: string,
  weights: number[],
  styles: ('normal' | 'italic')[],
  axes?: Record<string, [number, number]>,
): string {
  const enc = encodeURIComponent(family);

  // Variable-axis request returns one VF file spanning the whole range.
  // Axes must be sorted alphabetically; that's what Google's API expects.
  if (axes && Object.keys(axes).length > 0) {
    const keys = Object.keys(axes).sort();
    const ranges = keys.map((k) => {
      const range = axes[k]!;
      return `${range[0]}..${range[1]}`;
    });
    return `family=${enc}:${keys.join(',')}@${ranges.join(',')}`;
  }

  const hasItalic = styles.includes('italic');
  if (!hasItalic) return `family=${enc}:wght@${weights.join(';')}`;

  const variants: string[] = [];
  for (const s of styles) {
    const ital = s === 'italic' ? 1 : 0;
    for (const w of weights) variants.push(`${ital},${w}`);
  }
  variants.sort();
  return `family=${enc}:ital,wght@${variants.join(';')}`;
}
