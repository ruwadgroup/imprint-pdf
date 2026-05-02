# Tailwind in Imprint

Imprint uses the **actual Tailwind v4 Oxide compiler** — not a translator, not a
hand-curated subset. If a class works in Tailwind, it works in Imprint.

## Setup

### Vite

```ts
// vite.config.ts
import { imprint } from '@imprint-pdf/vite';

export default defineConfig({
  plugins: [imprint()],
});
```

That's it — `tailwind.stylesheet` is auto-detected from `src/app.css`,
`src/globals.css`, and a few other conventional locations. Pass
`{ tailwind: { stylesheet: './path/to/your.css' } }` only if your CSS entry
lives somewhere unusual.

Your `app.css` is the standard Tailwind v4 CSS-first stylesheet:

```css
/* src/app.css */
@import 'tailwindcss';
@import '@imprint-pdf/tailwind/preset';

@theme {
  --font-sans: 'Inter', sans-serif;
  --color-brand: #0f172a;
}
```

### Next.js

```ts
// next.config.ts
import { withImprint } from '@imprint-pdf/next/plugin';

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
`@imprint-pdf/tailwind`):

| Variant                        | Description                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `page-first:`                  | Applies only on the first page.                                  |
| `page-left:`                   | Applies on left-hand (even) pages.                               |
| `page-right:`                  | Applies on right-hand (odd) pages.                               |
| `imprint:cmyk-[c_m_y_k]`       | CMYK colour. Values 0–1 each. Enterprise (`@imprint-pdf/print`). |
| `imprint:spot-[Pantone-185-C]` | Named spot colour. Enterprise.                                   |
| `imprint:overprint`            | PDF overprint flag.                                              |
| `imprint:bleed-[3mm]`          | Bleed area size for this element.                                |

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

Tailwind v4 is configured CSS-first via `@theme`. Point both your web app and
Imprint at the same stylesheet:

```css
/* src/app.css (shared) */
@import 'tailwindcss';
@import '@imprint-pdf/tailwind/preset';

@theme {
  --font-sans: 'Inter', sans-serif;
  --color-brand: #0f172a;
}
```

```ts
// imprint.config.ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  // tailwind.stylesheet auto-detects ./src/app.css — no extra config needed.
});
```

If you still have a Tailwind v3 `tailwind.config.ts`, reference it from your CSS
via the v4 compatibility directive:

```css
@import 'tailwindcss';
@config '../tailwind.config.ts';
```
