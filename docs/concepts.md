# Concepts

Five things to understand: the IR, layout, typography, Tailwind, and runtime.

## The PdfNode IR

Everything you write in JSX becomes an immutable `PdfNode` tree. The custom
React reconciler (built with `react-reconciler`) emits this tree; the rest of
the pipeline consumes it without touching React.

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

Every HTML element (`<h1>`, `<p>`, `<table>`, `<ul>`) maps to the same
`PdfNode` types, with a `role` tag that the PDF/UA writer uses to emit the
structure tree.

## Layout

Layout runs in three passes.

**1. Style resolution.** The Tailwind resolver produces a CSS property map for
each node. Lightning CSS normalises it into a stable representation.

**2. Box layout.** Taffy (Rust→WASM) computes block/flex/grid geometry. Every
node gets a `x, y, width, height` rectangle plus computed padding, margin, and
border.

**3. Inline layout and text.** Within a text container, Parley-lite handles
inline-level boxes. HarfBuzz shapes each run of text, ICU4X provides line-break
opportunities, and the Knuth–Plass algorithm selects the globally optimal
paragraph breaks.

Page breaking runs after inline layout: the Plass page algorithm places content
across pages, minimising widow and orphan lines.

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

The font subset emitted into the PDF contains only the glyphs actually used.
A 12 MB CJK font becomes ~50 KB in output.

## Tailwind in Imprint

Imprint runs the **actual** Tailwind v4 Oxide compiler — not a translator, not
a subset. The flow:

1. At build time, the Vite/Webpack plugin runs Oxide over your source files and
   produces a CSS class-to-property map.
2. At render time, each node's `className` is looked up in that map. Arbitrary
   values and dynamic classes fall back to the Oxide WASM runtime.
3. Lightning CSS normalises the resulting CSS into a property map the layout
   engine understands.

Properties with no PDF analogue are silently dropped: `hover:`, `focus:`,
`transition-*`, `animation-*`, `position: sticky`, `position: fixed`.

The `print:` variant is always active. Imprint adds its own variants:
`page-first:`, `page-left:`, `page-right:`, `imprint:cmyk-[…]`, and
`imprint:spot-[…]`.

## Runtime

The rendering pipeline is designed to run identically on every JavaScript runtime.

| Runtime                  | WASM loading                            | Asset resolution         |
| ------------------------ | --------------------------------------- | ------------------------ |
| Node.js ≥ 20             | `fs.readFileSync` of inlined WASM bytes | `fs` + `fetch`           |
| Bun                      | Bun's native WASM imports               | `fs` + `fetch`           |
| Browser                  | `WebAssembly.instantiateStreaming`       | `fetch` + IndexedDB cache |
| Cloudflare Workers       | Static WASM module asset (à la Satori)  | `fetch` only             |
| Vercel Edge / Lambda     | Inlined or static asset                 | `fetch` + layer          |

All I/O is behind the `AssetResolver` interface. Swap it to control where fonts
and images come from without touching your component code.

## Where to go next

- **[Tailwind guide](guides/tailwind.md)** — variants, dropped properties
- **[Typography](guides/typography.md)** — shaping, fonts, CJK
- **[Paged layout](guides/paged-layout.md)** — breaks, widows, running headers
- **[Reference](reference/configuration.md)** — config schema
