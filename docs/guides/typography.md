# Typography

Imprint's typography pipeline is categorically better than what browsers
provide for paged, justified text. Here's what's in it and how to use it.

## Font loading

Declare fonts in `imprint.config.ts`:

```ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  fonts: [
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'Inter', src: './public/fonts/Inter-Bold.woff2', weight: 700 },
    { family: 'JetBrains Mono', src: './public/fonts/JetBrainsMono.woff2' },
  ],
});
```

Accepted formats: `.woff2`, `.woff`, `.otf`, `.ttf`. WOFF2 recommended —
smallest file, best subsetting.

### URL fonts (Google Fonts, Bunny Fonts)

```ts
{ family: 'Inter', src: 'https://fonts.gstatic.com/…/inter-latin.woff2' }
```

Fetched at render time. Cache the response via a custom `AssetResolver` for
production.

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

Imprint uses [HarfBuzz](https://harfbuzz.github.io/) (via `harfbuzzjs`, the
official `-DHB_TINY` WASM build) for shaping. Every OpenType feature is
available: GSUB/GPOS tables, kerning, ligatures, contextual alternates,
discretionary ligatures, stylistic sets.

Enable OpenType features on a `<Text>` or with Tailwind's `font-variant-*`
utilities:

```tsx
<Text className="font-feature-settings-['liga','kern','calt']">
  Typography-grade text.
</Text>
```

## Script support

| Script                | Status       |
| --------------------- | ------------ |
| Latin / Greek / Cyrillic | ✓ default  |
| Arabic (including Nastaliq) | ✓       |
| Hebrew (RTL)          | ✓            |
| Devanagari / Hindi    | ✓            |
| Thai / Khmer          | ✓            |
| CJK (Han, Kana, Hangul) | ✓          |
| Mathematical symbols  | ✓ (with MathML roadmap) |

Bidirectional text is handled by ICU4X (UAX #9 BiDi algorithm). Mixed
LTR/RTL paragraphs resolve correctly.

## Knuth–Plass justification

Enabled by default. Produces globally optimal line breaks across an entire
paragraph — the same algorithm TeX and InDesign use.

The difference is visible on justified text: no rivers of white space, no bad
breaks, no widows.

```tsx
<p className="text-justify leading-relaxed">
  Long paragraph that will be justified using the Knuth–Plass algorithm,
  producing measurably better output than greedy line breaking…
</p>
```

To use the greedy fallback (faster for very long documents):

```tsx
<Text lineBreaking="greedy" className="text-justify">…</Text>
```

## Hyphenation

```ts
// imprint.config.ts
defineConfig({
  typography: {
    hyphenation: {
      en: true,     // English (default: true)
      de: true,     // German
      fr: true,
    },
  },
});
```

Pattern files are Liang–Knuth `.dic` files loaded lazily per language. Based
on `hyphen` (same patterns used by LaTeX and LibreOffice).

## Page breaking — widows and orphans

The Plass two-pass page breaking algorithm minimises widows (isolated last
lines of a paragraph at the top of a page) and orphans (isolated first lines
at the bottom).

```tsx
// Per-element control via CSS Paged Media properties
<p className="[orphans:3] [widows:3]">Long paragraph…</p>

// Force a page break before this element
<h2 className="break-before-page">Chapter 2</h2>

// Prevent a break inside
<View className="break-inside-avoid">
  <img … />
  <p>Caption</p>
</View>
```

## Running headers and footers

```tsx
<Page>
  {/* Fixed-position header — appears on every page */}
  <View className="absolute top-0 left-0 right-0 h-12 flex items-center px-12">
    <span className="text-xs text-gray-400">Acme Corp — Confidential</span>
    <PageNumber className="ml-auto text-xs text-gray-400" />
  </View>

  {/* Page content starts below the header */}
  <View className="mt-12">…</View>
</Page>
```

`<PageNumber>` renders the current page number at render time.
