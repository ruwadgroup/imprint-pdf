# Integration — Tailwind config

Sharing your design system between your web app and PDF templates.

## Version support

imprint-pdf supports both **Tailwind v3** and **Tailwind v4**. It detects which
major you have installed (by reading `tailwindcss/package.json` from your
project) and dispatches to the matching code path. The rest of this guide shows
the v4 setup — for v3, jump to [Tailwind v3](#tailwind-v3).

### Dispatch precedence

When you call `pdf()` (or the lower-level `renderToBuffer` / `renderToStream`),
imprint-pdf picks a compiler in this order:

1. Explicit `tailwind.config` in `imprint.config.ts` → **v3** (loads the JS
   config you point at).
2. Explicit `tailwind.stylesheet` in `imprint.config.ts` → **v4** (CSS-first
   authoring).
3. Auto-detected `tailwind.config.{ts,js,mjs,cjs}` _and_ installed
   `tailwindcss@3` → **v3**.
4. Auto-detected `*.css` entry → **v4**.
5. Nothing detected → **v4** with a bare `@import "tailwindcss"` fallback.

## Single stylesheet, two targets

imprint-pdf runs **Tailwind v4**, which is configured CSS-first. The recommended
approach is one `app.css` used by both your web app (browser) and imprint-pdf
(PDF). Design tokens, font families, colors, and spacing scales apply
identically in both outputs.

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

imprint-pdf scans for your stylesheet in conventional locations — `src/app.css`,
`src/globals.css`, `src/index.css`, `src/styles{,/app,/globals}.css`,
`app/{app,globals}.css`, and `styles/{app,globals}.css` — and uses the first
match. Set `tailwind.stylesheet` explicitly only when your CSS entry lives
somewhere unusual. If nothing matches, imprint-pdf falls back to a bare
`@import "tailwindcss";` so the build still succeeds (without your theme).

## `@theme` tokens

Tailwind v4's `@theme` directive defines tokens as CSS variables. imprint-pdf
resolves them the same way the browser does, so `text-brand-900`, `p-section`,
and `font-sans` all work in PDFs:

```tsx
<Page className="p-section font-sans text-brand-900">…</Page>
```

You can also use the variables directly in arbitrary values:

```tsx
<div className="p-[var(--spacing-page)]" />
```

## Plugins

Tailwind v4 loads plugins via the `@plugin` directive in your stylesheet, not
via a JS `plugins` array. They work the same way in imprint-pdf:

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

Use the `print:` variant to apply PDF-specific styles that override web-facing
defaults:

```tsx
// Larger text in the PDF than on the web
<p className="text-sm print:text-[10pt]">Copy</p>

// Hide navigation elements that have no PDF meaning
<nav className="print:hidden">…</nav>
```

## Migrating from a `tailwind.config.ts` (v3)

If you have a Tailwind v3 JS config, you have two options:

1. **Port it to `@theme`** — recommended. Move `theme.extend.colors`,
   `fontFamily`, `spacing`, etc. into `@theme` blocks in your CSS file.
2. **Use the `@config` compatibility directive** — Tailwind v4 still reads a v3
   JS config when you reference it from CSS:

   ```css
   @import 'tailwindcss';
   @config '../tailwind.config.ts';
   ```

   Then point imprint-pdf at this stylesheet via `tailwind.stylesheet`. This is
   a migration shim; new tokens should go in `@theme`.
