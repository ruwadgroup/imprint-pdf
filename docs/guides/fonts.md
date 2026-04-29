# Fonts

Imprint embeds only the glyphs your document actually uses. A 12 MB CJK font
becomes ~50 KB in the output PDF. This is done via HarfBuzz's subsetter API.

## Declaring fonts

```ts
// imprint.config.ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  fonts: [
    // Local files
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'Inter', src: './public/fonts/Inter-Bold.woff2', weight: 700 },
    { family: 'Inter', src: './public/fonts/Inter-Italic.woff2', style: 'italic' },

    // Variable font
    {
      family: 'Inter Variable',
      src: './public/fonts/InterVariable.woff2',
      variable: true,
      axes: { wght: [100, 900] },
    },

    // Remote URL
    {
      family: 'Noto Sans Arabic',
      src: 'https://fonts.gstatic.com/…/noto-sans-arabic.woff2',
    },

    // Monospace
    { family: 'JetBrains Mono', src: './public/fonts/JetBrainsMono.woff2' },
  ],
});
```

## Using fonts

Apply fonts via Tailwind's `font-*` utilities after registering the `fontFamily`
in your `tailwind.config.ts`:

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
      },
    },
  },
};
```

```tsx
<p className="font-sans text-base">Latin text.</p>
<p className="font-arabic text-base">نص عربي.</p>
<code className="font-mono text-sm">const x = 1;</code>
```

## Fallback stack

Imprint resolves a font stack left-to-right. The first family that contains a
glyph for a given codepoint wins. Declare fallbacks in your Tailwind config:

```ts
fontFamily: {
  sans: ['Inter', 'Noto Sans', 'sans-serif'],
}
```

`sans-serif` and `serif` at the end resolve to Imprint's built-in fallback
fonts (a minimal Latin+CJK coverage set). These are not embedded by default —
explicitly declare the font files you want in the PDF.

## Font formats

| Format   | Supported | Notes                                |
| -------- | :-------: | ------------------------------------ |
| `.woff2` | ✓         | Recommended. Best compression.       |
| `.woff`  | ✓         |                                      |
| `.otf`   | ✓         |                                      |
| `.ttf`   | ✓         |                                      |
| `.eot`   | ✗         | Legacy IE format, not supported.     |

## System fonts

System fonts are not accessible at render time on edge runtimes. Declare all
fonts explicitly in `imprint.config.ts`. For CI reproducibility, commit font
files to the repo or fetch them from a stable CDN URL.

## Subsetting behaviour

HarfBuzz subsetting runs automatically at render time. The subset includes:

- Every glyph used in the document.
- OpenType features actually activated (`liga`, `kern`, `calt`, etc.).
- Variable font axes used in the document.

The original font file is never modified; the subset is generated in-memory and
embedded directly in the PDF object stream.
