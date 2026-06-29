import type { FontDeclaration } from '@imprint-pdf/core';

// Curated Google Fonts (served via Fontsource's jsdelivr CDN) that give the
// corpus a professional, print-grade voice instead of the standard PDF base-14.
// Families are grouped by role and composed into per-document bundles below, so
// every template pulls a consistent, deliberate type system.
//
// `family` is the name templates reference in `fontFamily`; keep it in sync with
// the `FONT` constants. Static weights only (TTF) - Fontsource WOFF2 can trip
// fontkit's subsetter, and the renderer defaults Fontsource to TTF for that
// reason.

export const FONT = {
  /** Neutral grotesque - invoices, statements, dashboards, forms, labels. */
  sans: 'Inter',
  /** Readable book serif - letters, contracts, resume prose. */
  serif: 'Source Serif 4',
  /** High-contrast display serif - certificate + menu headings. */
  display: 'Cormorant Garamond',
  /** Monospace - receipts, reference numbers, ledgers. */
  mono: 'JetBrains Mono',
  /** Formal script - certificate recipient name and signatures. */
  script: 'Pinyon Script',
} as const;

const family = (name: string, slug: string, specs: Array<[number, 'normal' | 'italic']>) =>
  specs.map(
    ([weight, style]): FontDeclaration => ({
      family: name,
      src: `fontsource:${slug}@5:${weight}:${style}`,
      weight,
      style,
    }),
  );

export const inter = family(FONT.sans, 'inter', [
  [400, 'normal'],
  [500, 'normal'],
  [600, 'normal'],
  [700, 'normal'],
]);

export const sourceSerif = family(FONT.serif, 'source-serif-4', [
  [400, 'normal'],
  [400, 'italic'],
  [600, 'normal'],
  [700, 'normal'],
]);

export const cormorant = family(FONT.display, 'cormorant-garamond', [
  [500, 'normal'],
  [600, 'normal'],
  [600, 'italic'],
  [700, 'normal'],
]);

export const jetbrainsMono = family(FONT.mono, 'jetbrains-mono', [
  [400, 'normal'],
  [500, 'normal'],
  [700, 'normal'],
]);

export const pinyon = family(FONT.script, 'pinyon-script', [[400, 'normal']]);

// Per-document-type bundles. A template declares the smallest bundle it needs so
// the rendered PDF only embeds fonts it actually uses.
export const fontSets = {
  /** Corporate sans for financial + data documents. */
  corporate: inter,
  /** Sans + mono for ledgers and reference codes. */
  corporateMono: [...inter, ...jetbrainsMono],
  /** Pure monospace receipt. */
  mono: jetbrainsMono,
  /** Editorial serif for prose documents, with a sans for labels/UI. */
  editorial: [...sourceSerif, ...inter],
  /** Ceremonial: display serif + script + a sans for fine print. */
  ceremonial: [...cormorant, ...pinyon, ...inter],
  /** Restaurant menu: display serif headings over a serif body. */
  menu: [...cormorant, ...sourceSerif],
} satisfies Record<string, FontDeclaration[]>;
