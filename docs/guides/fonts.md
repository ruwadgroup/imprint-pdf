# Fonts

Only the glyphs your document uses get embedded. A 12 MB CJK font becomes ~50 KB
in output, via HarfBuzz's subsetter.

## Declaring fonts

```ts
// imprint.config.ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [
    // Local files
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'Inter', src: './public/fonts/Inter-Bold.woff2', weight: 700 },
    {
      family: 'Inter',
      src: './public/fonts/Inter-Italic.woff2',
      style: 'italic',
    },

    // Variable font
    {
      family: 'Inter Variable',
      src: './public/fonts/InterVariable.woff2',
      variable: true,
      axes: { wght: [100, 900] },
    },

    // Remote URL — prefer stable hosts like Bunny Fonts or Fontsource via
    // jsdelivr. `fonts.gstatic.com` slugs rotate and 404 without warning.
    {
      family: 'Noto Sans Arabic',
      src: 'https://fonts.bunny.net/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff2',
    },

    // Monospace
    { family: 'JetBrains Mono', src: './public/fonts/JetBrainsMono.woff2' },
  ],
});
```

## Using fonts

Register fonts as `@theme` tokens in your Tailwind v4 stylesheet, then apply via
`font-*` utilities:

```css
/* src/app.css */
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-arabic: 'Noto Sans Arabic', sans-serif;
}
```

```tsx
<p className="font-sans text-base">Latin text.</p>
<p className="font-arabic text-base">نص عربي.</p>
<code className="font-mono text-sm">const x = 1;</code>
```

## Fallback stack

Font stacks resolve left-to-right. The first family with a glyph for the
codepoint wins. Declare fallbacks in your `@theme` block:

```css
@theme {
  --font-sans: 'Inter', 'Noto Sans', sans-serif;
}
```

A trailing `sans-serif` / `serif` resolves to imprint-pdf's built-in fallbacks
(minimal Latin+CJK coverage). Built-ins are not embedded by default — declare
the font files you want in the PDF.

## Font formats

| Format   | Supported | Notes                            |
| -------- | :-------: | -------------------------------- |
| `.woff2` |    ✓\*    | Recommended. Best compression.   |
| `.woff`  |     ✓     |                                  |
| `.otf`   |     ✓     |                                  |
| `.ttf`   |     ✓     |                                  |
| `.eot`   |     ✗     | Legacy IE format, not supported. |

### \* WOFF2 caveat

Fonts go through [`pdf-lib`](https://github.com/Hopding/pdf-lib), which uses
[`@pdf-lib/fontkit`](https://www.npmjs.com/package/@pdf-lib/fontkit) 1.1.1 for
decoding. The WOFF2 path throws `RangeError: Index out of range` on some
pre-subsetted WOFF2 files in the wild — notably Bunny Fonts' Outfit family. The
error string matches an unrelated buffer-aliasing bug fixed in core, which makes
diagnosis confusing.

**Workaround when WOFF2 fails**: switch to TTF. Google Fonts upstream on GitHub
or Fontsource on jsdelivr both ship TTFs. TTF and OTF are unaffected.

```ts
// If this throws RangeError…
{ family: 'Outfit', src: 'https://fonts.bunny.net/outfit/files/outfit-latin-400-normal.woff2' }

// …switch to the TTF.
{ family: 'Outfit', src: 'https://cdn.jsdelivr.net/npm/@fontsource/outfit@5/files/outfit-latin-400-normal.ttf' }
```

## System fonts

System fonts aren't accessible at render time on edge runtimes. Declare every
font explicitly in `imprint.config.ts`. For CI reproducibility, commit font
files to the repo or fetch from a stable CDN URL.

## Subsetting behaviour

HarfBuzz subsetting runs automatically. The subset includes:

- Every glyph used in the document.
- OpenType features actually activated (`liga`, `kern`, `calt`, etc.).
- Variable font axes used in the document.

The source font file is never modified — the subset is built in-memory and
embedded directly in the PDF object stream.
