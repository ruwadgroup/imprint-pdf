# Typography

The typography pipeline is categorically better than what browsers do for paged,
justified text. What's in it and how to use it.

## Font loading

Declare fonts in `imprint.config.ts`:

```ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'Inter', src: './public/fonts/Inter-Bold.woff2', weight: 700 },
    { family: 'JetBrains Mono', src: './public/fonts/JetBrainsMono.woff2' },
  ],
});
```

Formats: `.woff2`, `.woff`, `.otf`, `.ttf`. WOFF2 is recommended — smallest
file, best subsetting.

### URL fonts (Bunny Fonts, Fontsource, self-hosted)

```ts
// Bunny Fonts — stable, versioned URLs (Google Fonts mirror).
{ family: 'Inter', src: 'https://fonts.bunny.net/inter/files/inter-latin-400-normal.woff2' }
```

Avoid `fonts.gstatic.com` directly — Google rotates the version slug (`v15` →
`v22`) every few months. When it rotates, the URL 404s and the font silently
disappears from the PDF. Prefer Bunny Fonts, Fontsource via jsdelivr
(version-pinned npm), or self-hosting from `./public/fonts/`.

Fetched at render time. In production, cache the response via a custom
`AssetResolver`.

### Variable fonts

```ts
{
  family: 'Inter Variable',
  src: './public/fonts/InterVariable.woff2',
  variable: true,
  axes: { wght: [100, 900], slnt: [-10, 0] },
}
```

Use with Tailwind's `font-variation-settings` or the `font-weight` utilities.

## Shaping — HarfBuzz

Shaping runs through [HarfBuzz](https://harfbuzz.github.io/) (via `harfbuzzjs`,
the official `-DHB_TINY` WASM build). Every OpenType feature is available:
GSUB/GPOS, kerning, ligatures, contextual alternates, discretionary ligatures,
stylistic sets.

Enable OpenType features on a `<span>` or with Tailwind's `font-variant-*`
utilities:

```tsx
<span className="font-feature-settings-['liga','kern','calt']">
  Typography-grade text.
</span>
```

## Script support

| Script                      | Status                  |
| --------------------------- | ----------------------- |
| Latin / Greek / Cyrillic    | ✓ default               |
| Arabic (including Nastaliq) | ✓                       |
| Hebrew (RTL)                | ✓                       |
| Devanagari / Hindi          | ✓                       |
| Thai / Khmer                | ✓                       |
| CJK (Han, Kana, Hangul)     | ✓                       |
| Mathematical symbols        | ✓ (with MathML roadmap) |

ICU4X handles bidirectional text (UAX #9 BiDi). Mixed LTR/RTL paragraphs resolve
correctly.

## Knuth–Plass justification

On by default. Globally optimal line breaks across a paragraph — same algorithm
TeX and InDesign use.

The difference is visible on justified text: no rivers of white space, no bad
breaks, no widows.

```tsx
<p className="text-justify leading-relaxed">
  Long paragraph that will be justified using the Knuth–Plass algorithm,
  producing measurably better output than greedy line breaking…
</p>
```

Greedy fallback for very long documents:

```tsx
<span lineBreaking="greedy" className="text-justify">
  …
</span>
```

## Hyphenation

```ts
// imprint.config.ts
defineConfig({
  typography: {
    hyphenation: {
      en: true, // English (default: true)
      de: true, // German
      fr: true,
    },
  },
});
```

Liang–Knuth `.dic` patterns loaded lazily per language. Based on `hyphen` (same
patterns LaTeX and LibreOffice use).

## Page breaking — widows and orphans

Plass two-pass page breaking minimises widows (isolated last lines at the top of
a page) and orphans (isolated first lines at the bottom).

```tsx
// Per-element control via CSS Paged Media properties
<p className="[orphans:3] [widows:3]">Long paragraph…</p>

// Force a page break before this element
<h2 className="break-before-page">Chapter 2</h2>

// Prevent a break inside
<div className="break-inside-avoid">
  <img … />
  <p>Caption</p>
</div>
```

## Running headers and footers

```tsx
<Page>
  {/* Fixed-position header — appears on every page */}
  <div className="absolute top-0 left-0 right-0 h-12 flex items-center px-12">
    <span className="text-xs text-gray-400">Acme Corp — Confidential</span>
    <PageNumber className="ml-auto text-xs text-gray-400" />
  </div>

  {/* Page content starts below the header */}
  <div className="mt-12">…</div>
</Page>
```

`<PageNumber>` resolves to the current page number at draw time.
