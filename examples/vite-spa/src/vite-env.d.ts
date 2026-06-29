/// <reference types="vite/client" />

declare module 'virtual:imprint-classes' {
  import type { ResolvedStyle } from '@imprint-pdf/core';
  /** Tailwind classes compiled against the project theme at build time. */
  export const classMap: Record<string, ResolvedStyle>;
  export const classList: string[];
}
