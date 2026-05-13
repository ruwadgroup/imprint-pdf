# Concepts

Five things to know: the IR, layout, typography, Tailwind, and runtime.

## The PdfNode IR

JSX becomes an immutable `PdfNode` tree. The custom React reconciler emits it;
the rest of the pipeline consumes it without touching React.

```
DocumentNode
└── PageNode (size, orientation, bleed, marks)
    ├── ViewNode (block, flex, or grid container)
    │   ├── ViewNode
    │   └── TextNode (inline text run)
    ├── ImageNode (raster or SVG)
    ├── FormNode
    │   ├── TextFieldNode
    │   └── SignatureNode
    └── …
```

HTML elements (`<h1>`, `<p>`, `<table>`, `<ul>`) map to the same `PdfNode` types
with a `role` tag the PDF/UA writer uses to emit the structure tree.

## Layout

Three passes:

**1. Style resolution.** The Tailwind resolver builds a CSS property map per
node. Lightning CSS normalises it.

**2. Box layout.** Taffy (Rust→WASM) computes block/flex/grid geometry. Each
node gets `x, y, width, height` plus padding, margin, border.

**3. Inline layout and text.** Parley-lite handles inline boxes. HarfBuzz shapes
runs, ICU4X provides line-break opportunities, Knuth–Plass picks the globally
optimal paragraph breaks.

Page breaking runs after inline layout — Plass places content across pages and
minimises widow and orphan lines.

## Typography pipeline

```
Unicode text string
  │
  ▼  ICU4X — Unicode segmentation, BiDi (UAX #9), line-break opportunities (UAX #14)
Script + bidi runs
  │
  ▼  HarfBuzz (harfbuzzjs WASM) — GSUB/GPOS, kerning, ligatures, complex shaping
Glyph IDs + advances
  │
  ▼  Knuth–Plass — global paragraph breaking with box/glue/penalty model
Line boxes
  │
  ▼  fontkit — glyph outline extraction + subsetting
Embedded font + glyph paths in PDF content stream
```

The embedded subset contains only the glyphs you used. A 12 MB CJK font becomes
~50 KB.

## Tailwind in imprint-pdf

The **actual** Tailwind v4 Oxide compiler — not a translator, not a subset.

1. Build time: the Vite/Webpack plugin runs Oxide over your source and emits a
   CSS class-to-property map.
2. Render time: each node's `className` is looked up in the map. Arbitrary
   values and dynamic classes fall back to the Oxide WASM runtime.
3. Lightning CSS normalises into a property map the layout engine understands.

Properties with no PDF analogue drop silently: `hover:`, `focus:`,
`transition-*`, `animation-*`, `position: sticky`, `position: fixed`.

The `print:` variant is always active. Extra variants: `page-first:`,
`page-left:`, `page-right:`, `imprint:cmyk-[…]`, `imprint:spot-[…]`.

## Runtime

Same pipeline, every JavaScript runtime.

| Runtime              | WASM loading                            | Asset resolution          |
| -------------------- | --------------------------------------- | ------------------------- |
| Node.js ≥ 20         | `fs.readFileSync` of inlined WASM bytes | `fs` + `fetch`            |
| Bun                  | Bun's native WASM imports               | `fs` + `fetch`            |
| Browser              | `WebAssembly.instantiateStreaming`      | `fetch` + IndexedDB cache |
| Cloudflare Workers   | Static WASM module asset (à la Satori)  | `fetch` only              |
| Vercel Edge / Lambda | Inlined or static asset                 | `fetch` + layer           |

All I/O goes through `AssetResolver`. Swap it to control where fonts and images
come from — without touching your component code.

## Where to go next

- **[Tailwind guide](guides/tailwind.md)** — variants, dropped properties
- **[Typography](guides/typography.md)** — shaping, fonts, CJK
- **[Paged layout](guides/paged-layout.md)** — breaks, widows, running headers
- **[Reference](reference/configuration.md)** — config schema
