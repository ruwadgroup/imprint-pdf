# Configuration

All config lives in `imprint.config.ts` at the project root. Every field is
optional — sensible defaults mean a minimal config is usually enough:

```ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
});
```

Built-in defaults:

| Field                 | Default                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fonts`               | `[]` — only the built-in fallbacks are available until you add entries                                                                                                      |
| `tailwind.stylesheet` | Auto-detected from `src/app.css`, `src/globals.css`, `src/index.css`, `src/styles.css`, `src/styles/{app,globals}.css`, `app/{app,globals}.css`, `styles/{app,globals}.css` |
| `outDir`              | `'out'`                                                                                                                                                                     |
| `debug`               | `false`                                                                                                                                                                     |

The full surface, override what you need:

```ts
export default defineConfig({
  fonts: [],
  tailwind: {},
  typography: {},
  output: {},
  assets: {},
});
```

## `fonts`

Array of font face declarations. One entry per face.

```ts
fonts: [
  {
    family: string;               // CSS font-family name
    src: string;                  // file path or URL to .woff2 / .otf / .ttf
    weight?: number;              // CSS font-weight (default: 400)
    style?: 'normal' | 'italic'; // CSS font-style (default: 'normal')
    variable?: boolean;           // variable font (default: false)
    axes?: Record<string, [number, number]>; // axis ranges for variable fonts
  }
]
```

## `tailwind`

Tailwind v4 is configured CSS-first. Point imprint-pdf at the same stylesheet
your web app uses — design tokens, plugins, and custom variants resolve
identically in PDFs.

```ts
tailwind?: {
  stylesheet?: string;          // path to your Tailwind v4 CSS entry (auto-detected if omitted)
  config?: string;              // legacy: path to a Tailwind v3 tailwind.config.ts (compat shim)
}
```

`tailwind.stylesheet` is auto-detected from the conventional locations above —
first match wins. Most projects don't need to set it. If nothing matches, the
fallback is a bare `@import "tailwindcss";` — build succeeds, but without your
theme.

`config` is a backwards-compat shim for projects on a Tailwind v3 JS config.
Prefer the v4-native approach: reference your JS config from CSS via `@config`:

```css
/* src/app.css */
@import 'tailwindcss';
@config '../tailwind.config.ts';
```

Then pass `stylesheet: './src/app.css'`.

## `typography`

```ts
typography: {
  lineBreaking?: 'knuth-plass' | 'greedy'; // default: 'knuth-plass'
  hyphenation?: {
    [locale: string]: boolean | string;    // true = default patterns; string = custom .dic path
  };
  defaultWidows?: number;       // default: 2
  defaultOrphans?: number;      // default: 2
  subset?: boolean;             // HarfBuzz font subsetting (default: true)
}
```

## `output`

```ts
output: {
  intent?: 'PDF/X-4' | 'PDF/X-4p' | 'PDF/A-2b' | 'PDF/A-3'; // via @imprint-pdf/print
  outputIntent?: {
    profile: string;            // ICC profile name or path
    condition?: string;         // printing condition
  };
  compress?: boolean;           // PDF stream compression (default: true)
  version?: '1.7' | '2.0';     // PDF version (default: '1.7')
}
```

## `assets`

```ts
assets: {
  baseUrl?: string;             // base URL for relative asset paths on edge runtimes
  cacheDir?: string;            // local cache directory for fetched assets
}
```

## Full example

```ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'Inter', src: './public/fonts/Inter-Bold.woff2', weight: 700 },
    {
      family: 'Inter Variable',
      src: './public/fonts/InterVariable.woff2',
      variable: true,
      axes: { wght: [100, 900] },
    },
    {
      family: 'Noto Sans Arabic',
      src: 'https://fonts.bunny.net/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff2',
    },
  ],

  tailwind: {
    stylesheet: './src/app.css',
  },

  typography: {
    lineBreaking: 'knuth-plass',
    hyphenation: { en: true, de: true, fr: true },
    defaultWidows: 3,
    defaultOrphans: 3,
  },

  output: {
    compress: true,
    version: '1.7',
  },

  assets: {
    baseUrl: 'https://cdn.acme.com',
    cacheDir: './.imprint-cache',
  },
});
```
