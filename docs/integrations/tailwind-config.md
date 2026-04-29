# Integration — Tailwind config

Sharing your design system between your web app and PDF templates.

## Single config, two targets

The recommended approach is one `tailwind.config.ts` used by both your web app
(browser) and Imprint (PDF). Design tokens, font families, colors, and spacing
scales apply identically in both outputs.

```ts
// tailwind.config.ts (shared)
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{ts,tsx}',
    // Imprint scans the same source files — no extra config needed
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
      spacing: {
        page: '48pt',
        section: '32pt',
      },
    },
  },
} satisfies Config;
```

```ts
// imprint.config.ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  tailwind: {
    config: './tailwind.config.ts', // same file
  },
  fonts: [
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'JetBrains Mono', src: './public/fonts/JetBrainsMono.woff2' },
  ],
});
```

## Shared design tokens with CSS variables

Tailwind v4's `@theme` directive lets you define tokens as CSS variables.
Imprint resolves `@theme` tokens the same way the browser does:

```css
/* src/styles/tokens.css */
@theme {
  --color-brand-50: oklch(97% 0.02 220);
  --color-brand-500: oklch(62% 0.18 220);
  --color-brand-900: oklch(28% 0.12 220);
  --font-sans: 'Inter', sans-serif;
  --spacing-page: 48pt;
}
```

```tsx
<Page className="p-[var(--spacing-page)] text-brand-900">…</Page>
```

## Plugins

Tailwind plugins declared in `tailwind.config.ts` work in Imprint too:

```ts
import typography from '@tailwindcss/typography';

export default {
  plugins: [typography],
} satisfies Config;
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
