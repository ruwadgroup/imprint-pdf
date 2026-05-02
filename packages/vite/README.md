# @imprint/vite

Vite plugin for [Imprint](https://github.com/tamimbinhakim/imprint) —
compile-time Tailwind extraction and HMR in the `imprint dev` preview server.

```bash
pnpm add -D @imprint/vite vite
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { imprint } from '@imprint/vite';

export default defineConfig({
  plugins: [
    react(),
    imprint({
      // optional: path to imprint.config.ts
      config: './imprint.config.ts',
    }),
  ],
});
```

## What it does

- Runs Tailwind v4 Oxide over your source files at build time and injects the
  resolved CSS map into the Imprint render pipeline.
- Provides a virtual `@imprint/virtual/fonts` module so font files are imported
  cleanly without `fs` calls in browser builds.
- Integrates with `vite --watch` for HMR — change a template, the `imprint dev`
  preview reloads instantly.
- Handles WASM asset copying and `?url` imports for the standalone Cloudflare
  Workers build.

## Options

```ts
imprint({
  config?: string;           // path to imprint.config.ts (default: auto-detect)
  tailwind?: {
    stylesheet?: string;     // Tailwind v4 CSS entry. Auto-detected from src/app.css,
                             // src/globals.css, app/globals.css, etc.
    runtimeFallback?: boolean; // enable Oxide WASM fallback for dynamic classes (default: false)
  };
  wasm?: {
    inline?: boolean;        // base64-inline WASM in the bundle (default: false)
  };
})
```
