# Overview

A TypeScript library for generating PDFs as React components styled with real
Tailwind CSS. Same code path on Node, Bun, Cloudflare Workers, Vercel Edge, and
the browser.

## What you write

```tsx
import { pdf, Document, Page } from '@imprint-pdf/react';

const response = await pdf(
  <Document>
    <Page size="A4" className="p-12 font-sans bg-white">
      <h1 className="text-3xl font-bold tracking-tight">Hello, PDF</h1>
      <p className="mt-4 text-base leading-relaxed text-pretty">
        Real Tailwind. No Chromium.
      </p>
    </Page>
  </Document>,
);
```

`pdf()` returns a `Response`. Hand it to Next.js, Hono, `Bun.serve` — any web
framework. Need raw bytes? `{ as: 'bytes' }`. A `ReadableStream`?
`{ as: 'stream' }`. Fonts and Tailwind come from `imprint.config.ts`
automatically.

That's the whole authoring surface. No `StyleSheet.create`. No custom DSL. No
class subset table to memorise.

## What the pipeline does

```
React JSX (your component)
   │
   ▼  Custom reconciler (react-reconciler)
PdfNode IR tree
   │
   ▼  Tailwind compiler (Oxide v4 or PostCSS v3, auto-detected)
Resolved style map
   │
   ▼  Layout engine (Taffy WASM — Block + Flexbox + CSS Grid)
   │  + Inline layout (Parley-lite)
   │  + Knuth–Plass paragraph breaker
   │  + Plass page breaker (widows / orphans)
Computed geometry tree
   │
   ▼  Typography pipeline
   │  ICU4X segmentation + HarfBuzz shaping + fontkit subsetting
   │  + SVG → PDF vector ops
Positioned glyph runs + vector ops
   │
   ▼  PDF writer (pdf-lib v0 → imprint-pdf Rust WASM v1)
Response | Uint8Array | ReadableStream
```

## Pillars

- **Real Tailwind.** The actual Oxide compiler (v4) or PostCSS plugin (v3), not
  a translator. Plugins, `@theme` tokens, arbitrary values, OKLCH colors — all
  work.
- **No Chromium.** The entire pipeline is JavaScript + WASM. Cold starts in
  40–100 ms on Cloudflare Workers and Vercel Edge.
- **Real typography.** HarfBuzz shaping, Knuth–Plass justification, ICU4X
  bidirectional text, variable font support. Better than what browsers do for
  paged text.
- **CSS Grid.** Taffy ships Block + Flexbox + Grid in one layout pass.
  `@react-pdf/renderer`, Satori, and Forme do not have Grid.
- **AcroForms in JSX.** `<TextField>`, `<Signature>`, etc. produce real PDF form
  fields, not screenshots of form-like UI.
- **One API.** `pdf(<Doc />)` is everything. The output shape is a parameter,
  not a different function name.
- **Apache-2.0 throughout.** Engine, React layer, Tailwind compiler, CLI, and
  the PDF/X, PDF/UA, signing add-ons all under one permissive license.

## How it compares

| Capability                        | `@react-pdf/renderer` | Satori | Forme | Chromium SaaS  | **imprint-pdf** |
| --------------------------------- | :-------------------: | :----: | :---: | :------------: | :-------------: |
| Real Tailwind classes             |           ✗           |   ⚠    |   ✓   |       ✓        |      **✓**      |
| React / JSX components            |           ✓           |   ✓    |   ✓   |       ✗        |      **✓**      |
| Edge runtimes (CF Workers)        |           ⚠           |   ✓    |   ✓   |       ✗        |      **✓**      |
| CSS Grid                          |           ✗           |   ✗    |   ?   |       ✓        |      **✓**      |
| HarfBuzz shaping                  |           ✗           |   ✗    |   ✓   |       ✓        |      **✓**      |
| Knuth–Plass justification         |           ✗           |   ✗    |   ✗   |       ✗        |      **✓**      |
| Vector charts                     |           ✗           |   ✗    |   ?   |       ✓        |      **✓**      |
| AcroForms in JSX                  |           ✗           |  n/a   |   ✓   |       ✗        |      **✓**      |
| PDF/X-4 + CMYK                    |           ✗           |   ✗    |   ⚠   | DocRaptor only |      **✓**      |
| PDF/UA-1 tagged PDF               |           ✗           |   ✗    |   ✓   | DocRaptor only |      **✓**      |
| Sub-100 ms edge cold start        |          n/a          |   ✓    |   ✓   |       ✗        |      **✓**      |
| Same code: client + edge + server |        partial        |   ✓    |   ✓   |      n/a       |      **✓**      |
| Open source                       |           ✓           |   ✓    |   ✗   |       ✗        |      **✓**      |

## Status

Pre-1.0. Public API, package exports, and config format may change until
`v1.0.0`. See [`STABILITY.md`](../STABILITY.md) and
[`ROADMAP.md`](../ROADMAP.md).

## Next

- [Installation](installation.md)
- [Quick start](quick-start.md)
- [Concepts](concepts.md)
