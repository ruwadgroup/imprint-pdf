import type { ImprintVariant, ResolvedStyle, VariantStyles } from '../types.js';

// `null` until the two-pass renderer compiles Tailwind output. Kept distinct
// from an empty map so a missing setup throws instead of silently producing
// unstyled docs.
let _compiledClassMap: Map<string, ResolvedStyle> | null = null;

export function setCompiledClassMap(map: Map<string, ResolvedStyle>): void {
  _compiledClassMap = map;
}

export function clearCompiledClassMap(): void {
  _compiledClassMap = null;
}

const IMPRINT_VARIANT_PREFIXES: Record<string, ImprintVariant> = {
  'page-first': 'page-first',
  'page-left': 'page-left',
  'page-right': 'page-right',
  'imprint-bleed': 'bleed',
  'imprint-cmyk': 'cmyk',
};

function detectImprintVariant(cls: string): ImprintVariant | null {
  for (const [prefix, variant] of Object.entries(IMPRINT_VARIANT_PREFIXES)) {
    if (cls.startsWith(`${prefix}:`)) return variant;
  }
  return null;
}

function lookupClass(cls: string): ResolvedStyle | undefined {
  if (_compiledClassMap === null) return undefined;
  const direct = _compiledClassMap.get(cls);
  if (direct) return direct;
  // Strip PDF-irrelevant variant prefixes (`sm:`, `hover:`, ...) and retry.
  const colonIdx = cls.lastIndexOf(':');
  return colonIdx === -1 ? undefined : _compiledClassMap.get(cls.slice(colonIdx + 1));
}

export function resolveClassName(className: string): ResolvedStyle {
  return resolveClassNameWithVariants(className).base;
}

export function resolveClassNameWithVariants(className: string): {
  base: ResolvedStyle;
  variants: VariantStyles;
} {
  if (_compiledClassMap === null) return { base: {}, variants: {} };

  const classes = className.trim().split(/\s+/).filter(Boolean);
  const base: ResolvedStyle = {};
  const variants: VariantStyles = {};

  for (const cls of classes) {
    const variant = detectImprintVariant(cls);
    const hit = lookupClass(cls);
    if (!hit) continue;
    if (variant === null) {
      Object.assign(base, hit);
    } else {
      variants[variant] = { ...(variants[variant] ?? {}), ...hit };
    }
  }
  return { base, variants };
}

/** Merges `override` over `base`; `undefined` in `override` means "not set". */
export function mergeStyles(base: ResolvedStyle, override: ResolvedStyle): ResolvedStyle {
  const result: ResolvedStyle = { ...base };
  for (const [key, val] of Object.entries(override)) {
    if (val !== undefined) (result as Record<string, unknown>)[key] = val;
  }
  return result;
}

export function resolveStyles(className?: string, style?: Partial<ResolvedStyle>): ResolvedStyle {
  const base = className ? resolveClassName(className) : {};
  return mergeStyles(base, (style ?? {}) as ResolvedStyle);
}

export function resolveStylesWithVariants(
  className?: string,
  style?: Partial<ResolvedStyle>,
): { style: ResolvedStyle; variants: VariantStyles } {
  const { base, variants } = className
    ? resolveClassNameWithVariants(className)
    : { base: {} as ResolvedStyle, variants: {} as VariantStyles };
  return { style: mergeStyles(base, (style ?? {}) as ResolvedStyle), variants };
}
