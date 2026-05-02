# Cookbook — Custom fonts

Loading local fonts, Google Fonts, variable fonts, and system-style fallbacks.

## Local files

```ts
// imprint.config.ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  fonts: [
    { family: 'Inter', src: './public/fonts/Inter-Regular.woff2' },
    { family: 'Inter', src: './public/fonts/Inter-Medium.woff2', weight: 500 },
    {
      family: 'Inter',
      src: './public/fonts/Inter-SemiBold.woff2',
      weight: 600,
    },
    { family: 'Inter', src: './public/fonts/Inter-Bold.woff2', weight: 700 },
    {
      family: 'Inter',
      src: './public/fonts/Inter-Italic.woff2',
      style: 'italic',
    },
    {
      family: 'Inter',
      src: './public/fonts/Inter-BoldItalic.woff2',
      weight: 700,
      style: 'italic',
    },
  ],
});
```

Then register in your Tailwind v4 stylesheet:

```css
/* src/app.css */
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter', sans-serif;
}
```

## Variable fonts

```ts
{
  family: 'Inter Variable',
  src: './public/fonts/InterVariable.woff2',
  variable: true,
  axes: { wght: [100, 900] },
}
```

Usage with `font-variation-settings`:

```tsx
<p className="[font-variation-settings:'wght'_350]">Light paragraph text.</p>
<p className="[font-variation-settings:'wght'_680]">Semi-bold heading.</p>
```

## Google Fonts via URL

```ts
{
  family: 'Playfair Display',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2',
  weight: 700,
}
```

Fonts fetched by URL are cached in the `AssetResolver`. In production, wrap the
resolver to cache aggressively:

```ts
const cachedFetch = memoize(fetch);
renderToBuffer(<Doc />, {
  assetResolver: {
    fetch: (url, init) => cachedFetch(url, init),
  },
});
```

## Multilingual font stacks

```ts
fonts: [
  { family: 'Inter', src: './fonts/Inter.woff2' },                // Latin
  { family: 'Noto Sans Arabic', src: './fonts/NotoSansArabic.woff2' },
  { family: 'Noto Sans CJK SC', src: './fonts/NotoSansCJKsc.woff2' }, // Simplified Chinese
  { family: 'Noto Sans JP', src: './fonts/NotoSansJP.woff2' },    // Japanese
],
```

```css
/* src/app.css */
@theme {
  --font-sans:
    'Inter', 'Noto Sans Arabic', 'Noto Sans CJK SC', 'Noto Sans JP', sans-serif;
}
```

Imprint resolves glyphs from left to right in the font stack — Latin from Inter,
Arabic from Noto Sans Arabic, etc.

## Subsetting

Subsetting is automatic. The HarfBuzz subsetter embeds only the glyphs actually
used in the document. A full Noto Sans CJK file (~12 MB) might embed as ~60–100
KB for a document with 500 Chinese characters.

To disable subsetting (for debugging):

```ts
renderToBuffer(<Doc />, { typography: { subset: false } });
```
