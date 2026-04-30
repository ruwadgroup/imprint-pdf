import type { ResolvedStyle } from '../types.js';

// Compiled class map — injected by the two-pass Tailwind pipeline in renderToBuffer.
// className strings are only resolved when this map is present; without it every
// class resolves to an empty style object so that missing Tailwind config is
// immediately visible rather than silently approximated.
let _compiledClassMap: Map<string, ResolvedStyle> | null = null;

export function setCompiledClassMap(map: Map<string, ResolvedStyle>): void {
  _compiledClassMap = map;
}

export function clearCompiledClassMap(): void {
  _compiledClassMap = null;
}

export function resolveClassName(className: string): ResolvedStyle {
  if (_compiledClassMap === null) return {};

  const classes = className.trim().split(/\s+/).filter(Boolean);
  let resolved: ResolvedStyle = {};
  for (const cls of classes) {
    // Strip responsive / state prefixes (sm:, hover:, etc.) — PDF has no viewport.
    const colonIdx = cls.lastIndexOf(':');
    const rawCls = colonIdx !== -1 ? cls.slice(colonIdx + 1) : cls;
    const hit = _compiledClassMap.get(rawCls);
    if (hit) resolved = { ...resolved, ...hit };
  }
  return resolved;
}

// undefined values in override do not overwrite defined values in base
export function mergeStyles(base: ResolvedStyle, override: ResolvedStyle): ResolvedStyle {
  const result: ResolvedStyle = { ...base };
  for (const key of Object.keys(override) as Array<keyof ResolvedStyle>) {
    const val = override[key];
    if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

// inline styles take precedence over class-based styles
export function resolveStyles(className?: string, style?: Partial<ResolvedStyle>): ResolvedStyle {
  const base = className ? resolveClassName(className) : {};
  const inline = style ?? {};
  return mergeStyles(base, inline as ResolvedStyle);
}
