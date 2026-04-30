# Tailwind in Imprint

Imprint uses the **actual Tailwind v4 Oxide compiler** — not a translator, not a
hand-curated subset. If a class works in Tailwind, it works in Imprint.

## Setup

### Vite

```ts
// vite.config.ts
import { imprint } from '@imprint/vite';

export default defineConfig({
  plugins: [imprint({ tailwind: { config: './tailwind.config.ts' } })],
});
```

### Next.js

```ts
// next.config.ts
import { withImprint } from '@imprint/next/plugin';

export default withImprint()({
  /* next config */
});
```

## How it resolves classes

1. **Compile-time** (static classes): Oxide scans your source files, resolves
   every class to a CSS property map, and embeds the map in the bundle. Zero
   runtime cost.

2. **Runtime fallback** (dynamic classes): If a class name is computed at render
   time (`className={someVar}`), Imprint falls back to the Oxide WASM module at
   ~5–20 ms per render. Enable with `tailwind: { runtimeFallback: true }`.

3. **Always on: `print:` variant.** Unlike the browser, where `print:` only
   fires in print preview, Imprint treats `print:` as always active. Your
   print-specific layout applies in every render.

## Imprint-specific variants

These are added via the Imprint Tailwind plugin (auto-loaded by
`@imprint/tailwind`):

| Variant                        | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `page-first:`                  | Applies only on the first page.                              |
| `page-left:`                   | Applies on left-hand (even) pages.                           |
| `page-right:`                  | Applies on right-hand (odd) pages.                           |
| `imprint:cmyk-[c_m_y_k]`       | CMYK colour. Values 0–1 each. Enterprise (`@imprint/print`). |
| `imprint:spot-[Pantone-185-C]` | Named spot colour. Enterprise.                               |
| `imprint:overprint`            | PDF overprint flag.                                          |
| `imprint:bleed-[3mm]`          | Bleed area size for this element.                            |

## What gets dropped

CSS properties with no PDF analogue are silently dropped. Pass
`{ strict: true }` to `renderToBuffer` to get warnings instead.

| Dropped category           | Examples                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| Interaction pseudo-classes | `hover:`, `focus:`, `active:`, `focus-visible:`                          |
| Position modes             | `position: sticky`, `position: fixed`                                    |
| Overflow / scroll          | `overflow: auto`, `overflow: scroll`                                     |
| Transitions / animations   | `transition-*`, `animation-*`, `@keyframes`                              |
| Screen pseudo-selectors    | `sm:`, `md:`, `lg:` — all treated as always-active (no viewport concept) |

## Responsive utilities

There is no viewport in a PDF. Screen breakpoints (`sm:`, `md:`, `lg:`) are
treated as always-active — all styles apply regardless of breakpoint. Design
your PDFs without responsive prefixes, or use `page-first:` / `page-left:` /
`page-right:` for page-conditional styles.

## Arbitrary values

All arbitrary value syntax works:

```tsx
<p className="text-[14pt] leading-[1.6] text-[#1a1a1a] mt-[8mm]" />
<div className="grid grid-cols-[1fr_2fr_1fr] gap-[6mm]" />
```

Length units: `px`, `pt`, `mm`, `cm`, `in`, `em`, `rem`, `%` — all resolved
correctly by the PDF layout engine.

## Sharing your design system

Point both your web and PDF Tailwind configs at the same tokens:

```ts
// tailwind.config.ts (shared)
export default {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: { brand: '#0F172A' },
    },
  },
};
```

```ts
// imprint.config.ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  tailwind: { config: './tailwind.config.ts' }, // same file
});
```
