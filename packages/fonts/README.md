# @imprint-pdf/fonts

Zero-config Google Fonts (via Fontsource) for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf).

```bash
pnpm add @imprint-pdf/fonts
```

## Usage

```ts
// imprint.config.ts
import { defineConfig } from '@imprint-pdf/core/config';
import { googleFont } from '@imprint-pdf/fonts/google';

export default defineConfig({
  fonts: [
    ...googleFont('Inter', { weight: ['400', '500', '700'] }),
    ...googleFont('JetBrains Mono'),
    ...googleFont('Outfit', { variable: true, axes: { wght: [100, 900] } }),
  ],
});
```

That's the whole API. Each `googleFont()` call returns one or more
`FontDeclaration` objects — spread them into the `fonts` array.

No build-time downloads. No URL hunting. The fonts resolve from the Fontsource
jsdelivr CDN at render time via imprint-pdf's `fontsource:` URL scheme, with
automatic WOFF2 → TTF fallback if a decoder rejects the woff2 file.

## Options

```ts
googleFont(family, {
  weight?: '100' | '200' | … | '900' | array     // default ['400']
  style?: 'normal' | 'italic' | array             // default ['normal']
  variable?: boolean                              // use the variable file
  axes?: Record<string, [number, number]>         // axis ranges (with `variable: true`)
  subset?: string                                  // Fontsource subset slug, default 'latin'
  version?: string                                 // pin a Fontsource major, default '5'
})
```

## How it works

`googleFont('Inter', { weight: ['400', '700'] })` returns

```ts
[
  {
    family: 'Inter',
    src: 'fontsource:inter@5:400:normal:latin:woff2',
    weight: 400,
    style: 'normal',
  },
  {
    family: 'Inter',
    src: 'fontsource:inter@5:700:normal:latin:woff2',
    weight: 700,
    style: 'normal',
  },
];
```

The `fontsource:` URLs are rewritten to jsdelivr CDN URLs by
`@imprint-pdf/core`'s asset resolver at render time:

```
https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff2
```
