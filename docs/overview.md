# Overview

Imprint is a TypeScript library for generating PDFs as React components styled
with real Tailwind CSS. It runs on Node, Bun, Cloudflare Workers, Vercel Edge,
and the browser — with the same code path.

## What you write

```tsx
import { renderToBuffer, Document, Page } from '@imprint/react';

const pdf = await renderToBuffer(
  <Document>
    <Page size="A4" className="p-12 font-sans bg-white">
      <h1 className="text-3xl font-bold tracking-tight">Hello, PDF</h1>
      <p className="mt-4 text-base leading-relaxed text-pretty">
        Real Tailwind. No Chromium.
      </p>
    </Page>
  </Document>,
  { fonts: ['Inter'] },
);
```

That's the whole authoring surface. No `StyleSheet.create`, no custom DSL, no
class subset table to memorise.

## What the pipeline does

```
React JSX (your component)
   │
   ▼  Custom reconciler (react-reconciler)
PdfNode IR tree
   │
   ▼  @imprint/tailwind (Oxide v4 compiler)
Resolved style map (Lightning CSS AST)
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
Uint8Array | ReadableStream
```

## Pillars

- **Real Tailwind.** The actual Tailwind v4 Oxide compiler resolves your classes
  — including your plugins, your `@theme`, your arbitrary values.
- **No Chromium.** The entire pipeline is JavaScript + WASM. Cold starts in the
  40–100 ms range on Cloudflare Workers and Vercel Edge.
- **Real typography.** HarfBuzz shaping, Knuth–Plass justification, ICU4X
  bidirectional text, variable font support. Better than what browsers do for
  paged text.
- **CSS Grid.** Taffy is the only open layout engine that ships Block + Flexbox
  - Grid. `@react-pdf/renderer`, Satori, and Forme do not have Grid.
- **AcroForms in JSX.** Declarative `<TextField>`, `<Signature>`, etc. that
  produce real PDF form fields — not screenshots of form-like UI.
- **Open core.** `@imprint/core` and `@imprint/react` are Apache-2.0. PDF/X,
  PDF/UA, and signing are BSL enterprise packages.

## How it compares

| Capability                        | `@react-pdf/renderer` | Satori | Forme | Chromium SaaS  |    **Imprint**     |
| --------------------------------- | :-------------------: | :----: | :---: | :------------: | :----------------: |
| Real Tailwind classes             |           ✗           |   ⚠    |   ✓   |       ✓        |       **✓**        |
| React / JSX components            |           ✓           |   ✓    |   ✓   |       ✗        |       **✓**        |
| Edge runtimes (CF Workers)        |           ⚠           |   ✓    |   ✓   |       ✗        |       **✓**        |
| CSS Grid                          |           ✗           |   ✗    |   ?   |       ✓        |       **✓**        |
| HarfBuzz shaping                  |           ✗           |   ✗    |   ✓   |       ✓        |       **✓**        |
| Knuth–Plass justification         |           ✗           |   ✗    |   ✗   |       ✗        |       **✓**        |
| Vector charts                     |           ✗           |   ✗    |   ?   |       ✓        |       **✓**        |
| AcroForms in JSX                  |           ✗           |  n/a   |   ✓   |       ✗        |       **✓**        |
| PDF/X-4 + CMYK                    |           ✗           |   ✗    |   ⚠   | DocRaptor only | **✓ (Enterprise)** |
| PDF/UA-1 tagged PDF               |           ✗           |   ✗    |   ✓   | DocRaptor only | **✓ (Enterprise)** |
| Sub-100 ms edge cold start        |          n/a          |   ✓    |   ✓   |       ✗        |       **✓**        |
| Same code: client + edge + server |        partial        |   ✓    |   ✓   |      n/a       |       **✓**        |
| Open source                       |           ✓           |   ✓    |   ✗   |       ✗        |       **✓**        |

## Status

Pre-1.0. The public API, package exports, and on-disk config format may change
until `v1.0.0`. See [`STABILITY.md`](../STABILITY.md) and
[`ROADMAP.md`](../ROADMAP.md).

## Next

- [Installation](installation.md)
- [Quick start](quick-start.md)
- [Concepts](concepts.md)
