# @imprint/tailwind

Real Tailwind v4 integration for [Imprint](https://github.com/tamimbinhakim/imprint).

Not a subset. Not a DSL. The actual Tailwind v4 Oxide compiler — your plugins,
your `@theme`, your arbitrary values (`text-[#bada55]`, `mt-[3.7mm]`), all
resolved the same way they are in the browser.

```bash
pnpm add -D @imprint/tailwind tailwindcss
```

## How it works

**Compile-time (recommended):** A Vite/Webpack plugin runs the Tailwind v4
Oxide CLI over your source files at build time. Classes are resolved into a
static map that ships at zero runtime cost.

**Runtime fallback:** An Oxide WASM build resolves classes at request time —
useful for dynamic class names generated from data. Adds ~2 MB to the bundle;
lazy-loaded on first use.

**Hybrid (default):** The plugin pre-compiles static classes; the WASM
fallback handles the rest. Mirrors how Tailwind v4 itself works in the
playground.

## Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { imprintTailwind } from '@imprint/tailwind/vite';

export default defineConfig({
  plugins: [imprintTailwind()],
});
```

## Webpack / Next.js

```ts
// next.config.ts
import { withImprintTailwind } from '@imprint/tailwind/webpack';

export default withImprintTailwind()({
  // next config
});
```

## Custom Tailwind config

Pass the path to your `tailwind.config.ts` — Imprint inherits your entire
design system:

```ts
imprintTailwind({ config: './tailwind.config.ts' })
```

## Imprint-specific Tailwind variants

| Variant                            | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `print:`                           | Always active (unlike the browser).         |
| `page-first:`, `page-left:`, `page-right:` | CSS Paged Media analogues.        |
| `imprint:cmyk-[c_m_y_k]`          | CMYK colour (Enterprise `@imprint/print`).  |
| `imprint:bleed-[size]`             | Bleed area.                                 |
| `imprint:spot-[Pantone-185-C]`     | Spot colour.                                |
| `imprint:overprint`                | PDF overprint flag.                         |

## What gets dropped

CSS properties with no PDF analogue are silently discarded: `hover:`,
`focus:`, `active:`, `:not()` pseudo-selectors, `transition-*`,
`animation-*`, `position: sticky`, `position: fixed`. Pass `{ strict: true }`
to the render options to surface these as warnings instead.
