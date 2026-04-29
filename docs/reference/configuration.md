# Configuration

All configuration lives in `imprint.config.ts` at the project root.

```ts
import { defineConfig } from '@imprint/core/config';

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

```ts
tailwind: {
  config?: string;              // path to tailwind.config.ts (auto-detected)
  runtimeFallback?: boolean;    // enable Oxide WASM for dynamic classes (default: false)
  strict?: boolean;             // warn on dropped CSS properties (default: false)
}
```

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
    config: './tailwind.config.ts',
    runtimeFallback: false,
    strict: true,
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
