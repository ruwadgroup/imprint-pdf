# Integration — Tailwind config

Share your design system between web and PDF.

## Version support

Both **Tailwind v3** and **v4** are supported. imprint-pdf detects which major
is installed (by reading `tailwindcss/package.json`) and dispatches to the
matching code path. The rest of this guide is v4 — for v3, jump to
[Tailwind v3](#tailwind-v3).

### Dispatch precedence

`pdf()` (and the lower-level `renderToBuffer` / `renderToStream`) picks a
compiler in this order:

1. Explicit `tailwind.config` in `imprint.config.ts` → **v3** (loads the JS
   config you point at).
2. Explicit `tailwind.stylesheet` in `imprint.config.ts` → **v4** (CSS-first
   authoring).
3. Auto-detected `tailwind.config.{ts,js,mjs,cjs}` _and_ installed
   `tailwindcss@3` → **v3**.
4. Auto-detected `*.css` entry → **v4**.
5. Nothing detected → **v4** with a bare `@import "tailwindcss"` fallback.

## Single stylesheet, two targets

Tailwind v4 is configured CSS-first. Use one `app.css` for both the web app
(browser) and imprint-pdf (PDF). Design tokens, font families, colors, and
spacing apply identically in both outputs.

```css
/* src/app.css (shared) */
@import 'tailwindcss';
@import '@imprint-pdf/react/preset';

@theme {
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --color-brand-50: #f0f9ff;
  --color-brand-500: #0ea5e9;
  --color-brand-900: #0c4a6e;

  --spacing-page: 48pt;
  --spacing-section: 32pt;
}
```

```ts
// imprint.config.ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  // tailwind.stylesheet auto-detects ./src/app.css — no extra config needed.
  fonts: [
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'JetBrains Mono', src: './public/fonts/JetBrainsMono.woff2' },
  ],
});
```

imprint-pdf scans for the stylesheet in conventional locations — `src/app.css`,
`src/globals.css`, `src/index.css`, `src/styles{,/app,/globals}.css`,
`app/{app,globals}.css`, and `styles/{app,globals}.css` — and uses the first
match. Set `tailwind.stylesheet` explicitly only for unusual layouts. If nothing
matches, the fallback is a bare `@import "tailwindcss";` — the build succeeds,
but without your theme.

## `@theme` tokens

Tailwind v4's `@theme` directive defines tokens as CSS variables. imprint-pdf
resolves them the same way the browser does — `text-brand-900`, `p-section`,
`font-sans` all work in PDFs:

```tsx
<Page className="p-section font-sans text-brand-900">…</Page>
```

You can also use the variables directly in arbitrary values:

```tsx
<div className="p-[var(--spacing-page)]" />
```

## Plugins

Tailwind v4 loads plugins via the `@plugin` directive in your stylesheet, not a
JS `plugins` array. Same in imprint-pdf:

```css
/* src/app.css */
@import 'tailwindcss';
@plugin '@tailwindcss/typography';
```

```tsx
<article className="prose prose-sm">
  <h2>Section heading</h2>
  <p>Prose-styled body copy in your PDF.</p>
</article>
```

## Print-specific overrides

Use the `print:` variant for PDF-specific overrides on top of web defaults:

```tsx
// Larger text in the PDF than on the web
<p className="text-sm print:text-[10pt]">Copy</p>

// Hide navigation elements that have no PDF meaning
<nav className="print:hidden">…</nav>
```

## Migrating from a `tailwind.config.ts` (v3)

Two options:

1. **Port it to `@theme`** (recommended). Move `theme.extend.colors`,
   `fontFamily`, `spacing`, etc. into `@theme` blocks in your CSS.
2. **Use the `@config` compat directive.** Tailwind v4 still reads a v3 JS
   config when referenced from CSS:

   ```css
   @import 'tailwindcss';
   @config '../tailwind.config.ts';
   ```

   Then point imprint-pdf at this stylesheet via `tailwind.stylesheet`.
   `@config` is a migration shim — put new tokens in `@theme`.
