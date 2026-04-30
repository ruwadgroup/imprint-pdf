import type { ResolvedStyle } from '../types.js';

// Populated by the two-pass Tailwind pipeline in renderToBuffer. When null,
// every class resolves to {} — making missing Tailwind setup visible at render
// time instead of silently shipping unstyled output that "almost" works.
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
    // Strip the last variant prefix (sm:, hover:, dark:, …). PDF has no
    // viewport / interaction state, so we treat every variant as if it always
    // matches and let later classes win — same as Tailwind's source order.
    const colonIdx = cls.lastIndexOf(':');
    const rawCls = colonIdx !== -1 ? cls.slice(colonIdx + 1) : cls;
    const hit = _compiledClassMap.get(rawCls);
    if (hit) resolved = { ...resolved, ...hit };
  }
  return resolved;
}

// `undefined` in `override` is treated as "not set" rather than "clear" — so
// passing `{ color: undefined }` doesn't wipe out a class-defined color.
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

export function resolveStyles(className?: string, style?: Partial<ResolvedStyle>): ResolvedStyle {
  const base = className ? resolveClassName(className) : {};
  const inline = style ?? {};
  return mergeStyles(base, inline as ResolvedStyle);
}
