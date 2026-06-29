import type { ResolvedStyle, TailwindClassMapInput } from '@imprint-pdf/core';

export function normalizeClassMap(
  input: TailwindClassMapInput | undefined,
): Map<string, ResolvedStyle> {
  if (!input) return new Map();
  return input instanceof Map ? input : new Map(Object.entries(input));
}
