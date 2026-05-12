# @imprint-pdf/core

Framework-free IR, layout types, and asset resolution for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Zero React. Zero
filesystem in the runtime path. Runs on Node, Bun, Cloudflare Workers, Vercel
Edge, and the browser.

```bash
pnpm add @imprint-pdf/core
```

## What's in here

- **PdfNode IR** — the intermediate representation shared across the pipeline.
  `DocumentNode`, `PageNode`, `ViewNode`, `TextNode`, `ImageNode`, `SvgNode`,
  `FormNode`, and their subtypes.
- **Layout types** — resolved style maps, computed geometry, break hints.
- **`defineConfig`** — type-preserving, Zod-validated `imprint.config.ts`
  schema.
- **`AssetResolver` interface** — `fetch`, `fs`, `IndexedDB`, or custom loaders
  for fonts and images.
- **Hashing** — SHA-256 helpers for cache keys and node fingerprints.

## Subpath entries

| Entry                      | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `@imprint-pdf/core`        | PdfNode IR, hashing, shared types                  |
| `@imprint-pdf/core/config` | `defineConfig`, Zod schema, all config types       |
| `@imprint-pdf/core/assets` | `AssetResolver`, built-in `fetch` / `fs` resolvers |

## Defining config

```ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
  // tailwind.stylesheet auto-detects src/app.css, src/globals.css, etc.
});
```

`defineConfig` returns the input type (not a widened union), so your IDE
autocompletes every field.

## Design notes

- `@imprint-pdf/core` has **no workspace dependencies**. It's the leaf node of
  the dependency graph.
- CSS properties unsupported by the PDF model are silently dropped by default.
  Pass `{ strict: true }` to `pdf()` to surface them as errors.
- `AssetResolver` is the single seam for all I/O — swap it to run identically in
  Node, the browser, and Cloudflare Workers.
