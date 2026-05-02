# Configuration

All configuration lives in `imprint.config.ts` at the project root. Every field
is optional — Imprint applies sensible defaults so a minimal config is usually
enough:

```ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
});
```

Built-in defaults:

| Field                 | Default                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fonts`               | `[]` — only Imprint's built-in fallbacks are available until you add entries                                                                                                |
| `tailwind.stylesheet` | Auto-detected from `src/app.css`, `src/globals.css`, `src/index.css`, `src/styles.css`, `src/styles/{app,globals}.css`, `app/{app,globals}.css`, `styles/{app,globals}.css` |
| `outDir`              | `'out'`                                                                                                                                                                     |
| `debug`               | `false`                                                                                                                                                                     |

The full surface — overridable when you need it:

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

Array of font declarations. Each entry describes one font face.

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

Imprint runs **Tailwind v4**, which is configured CSS-first. Point Imprint at
the same stylesheet your web app uses and your design tokens, plugins, and
custom variants resolve identically in PDFs.

```ts
tailwind?: {
  stylesheet?: string;          // path to your Tailwind v4 CSS entry (auto-detected if omitted)
  config?: string;              // legacy: path to a Tailwind v3 tailwind.config.ts (compat shim)
}
```

`tailwind.stylesheet` is auto-detected — Imprint scans the conventional
locations listed above and uses the first match. Most projects don't need to set
it explicitly. If nothing matches, Imprint falls back to a bare
`@import "tailwindcss";` so the build still succeeds (without your theme).

The `config` field is a backwards-compatibility shim for projects still on a
Tailwind v3 JS config — prefer the v4-native approach by referencing your JS
config from CSS via `@config`:

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
  intent?: 'PDF/X-4' | 'PDF/X-4p' | 'PDF/A-2b' | 'PDF/A-3'; // Enterprise @imprint/print
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
import { defineConfig } from '@imprint/core/config';

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
      src: 'https://fonts.gstatic.com/…/noto-sans-arabic.woff2',
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
