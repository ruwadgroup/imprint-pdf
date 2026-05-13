# Tailwind in imprint-pdf

The **actual Tailwind v4 Oxide compiler** — not a translator, not a curated
subset. If a class works in Tailwind, it works here.

## Setup

### Vite

```ts
// vite.config.ts
import { imprint } from '@imprint-pdf/vite';

export default defineConfig({
  plugins: [imprint()],
});
```

That's it. `tailwind.stylesheet` is auto-detected from `src/app.css`,
`src/globals.css`, and similar locations. Set
`{ tailwind: { stylesheet: './path/to/your.css' } }` only when your CSS entry
lives somewhere unusual.

`app.css` is the standard Tailwind v4 CSS-first stylesheet:

```css
/* src/app.css */
@import 'tailwindcss';
@import '@imprint-pdf/react/preset';

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

## How classes resolve

1. **Compile-time** (static classes): Oxide scans source files, resolves each
   class to a CSS property map, and embeds it in the bundle. Zero runtime cost.

2. **Runtime fallback** (dynamic classes): when a class name is computed at
   render time (`className={someVar}`), the Oxide WASM module runs at ~5–20
   ms/render. Enable with `tailwind: { runtimeFallback: true }`.

3. **Always-on `print:`.** Browsers only fire `print:` in print preview;
   imprint-pdf treats it as always active. Print-specific layout applies in
   every render.

## Imprint-specific variants

Registered by the preset (auto-loaded when you
`@import '@imprint-pdf/react/preset'` in your stylesheet):

| Variant                        | Description                                             |
| ------------------------------ | ------------------------------------------------------- |
| `page-first:`                  | Applies only on the first page.                         |
| `page-left:`                   | Applies on left-hand (even) pages.                      |
| `page-right:`                  | Applies on right-hand (odd) pages.                      |
| `imprint:cmyk-[c_m_y_k]`       | CMYK colour. Values 0–1 each. Via `@imprint-pdf/print`. |
| `imprint:spot-[Pantone-185-C]` | Named spot colour.                                      |
| `imprint:overprint`            | PDF overprint flag.                                     |
| `imprint:bleed-[3mm]`          | Bleed area size for this element.                       |

## What gets dropped

CSS properties with no PDF analogue drop silently. Pass `{ strict: true }` to
`pdf()` to warn instead.

| Dropped category           | Examples                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| Interaction pseudo-classes | `hover:`, `focus:`, `active:`, `focus-visible:`                          |
| Position modes             | `position: sticky`, `position: fixed`                                    |
| Overflow / scroll          | `overflow: auto`, `overflow: scroll`                                     |
| Transitions / animations   | `transition-*`, `animation-*`, `@keyframes`                              |
| Screen pseudo-selectors    | `sm:`, `md:`, `lg:` — all treated as always-active (no viewport concept) |

## Responsive utilities

PDFs have no viewport. Breakpoints (`sm:`, `md:`, `lg:`) are always active —
every style applies regardless. Design without responsive prefixes, or use
`page-first:` / `page-left:` / `page-right:` for page-conditional styles.

## Arbitrary values

All arbitrary-value syntax works:

```tsx
<p className="text-[14pt] leading-[1.6] text-[#1a1a1a] mt-[8mm]" />
<div className="grid grid-cols-[1fr_2fr_1fr] gap-[6mm]" />
```

Length units: `px`, `pt`, `mm`, `cm`, `in`, `em`, `rem`, `%` — all resolved
correctly by the layout engine.

## Sharing your design system

Tailwind v4 is configured CSS-first via `@theme`. Point both your web app and
imprint-pdf at the same stylesheet:

```css
/* src/app.css (shared) */
@import 'tailwindcss';
@import '@imprint-pdf/react/preset';

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

For a Tailwind v3 `tailwind.config.ts`, reference it from your CSS via the v4
compat directive:

```css
@import 'tailwindcss';
@config '../tailwind.config.ts';
```
