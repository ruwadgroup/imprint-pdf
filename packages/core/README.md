# @imprint-pdf/core

Framework-free PDF IR, layout types, asset resolution, and Tailwind CSS
processing for [Imprint](https://github.com/tamimbinhakim/imprint-pdf).

Zero React. Zero filesystem in the runtime path. Runs on Node, Bun, Cloudflare
Workers, Vercel Edge, and the browser.

```bash
pnpm add @imprint-pdf/core
```

## What's in here

- **PdfNode IR** — the immutable intermediate representation shared across the
  entire pipeline. `DocumentNode`, `PageNode`, `ViewNode`, `TextNode`,
  `ImageNode`, `SvgNode`, `FormNode`, and their subtypes.
- **Layout types** — resolved style maps, computed geometry, break hints.
- **`defineConfig`** — type-preserving, Zod-validated `imprint.config.ts`
  schema.
- **`AssetResolver` interface** — `fetch`, `fs`, `IndexedDB`, or custom loaders
  for fonts and images.
- **CSS normaliser** — Lightning CSS (WASM) parses Tailwind output into a stable
  property map; unsupported PDF properties are surfaced as warnings.
- **Hashing** — SHA-256 helpers for cache keys and node fingerprints.

## Subpath entries

| Entry                      | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `@imprint-pdf/core`        | PdfNode IR, CSS normaliser, hashing, shared types           |
| `@imprint-pdf/core/config` | `defineConfig`, `parseConfig`, Zod schema, all config types |
| `@imprint-pdf/core/assets` | `AssetResolver`, built-in `fetchResolver`, `fsResolver`     |

## Quick start

```ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
  // tailwind.stylesheet auto-detects src/app.css, src/globals.css, etc.
});
```

## Design notes

- `@imprint-pdf/core` has **no workspace dependencies**. It is the leaf node.
- CSS properties unsupported by the PDF model are **silently dropped** by
  default; pass `{ strict: true }` to `renderToBuffer` to surface them as
  errors.
- `AssetResolver` is the single seam for all I/O — swap it to run identically in
  Node and Cloudflare Workers.
