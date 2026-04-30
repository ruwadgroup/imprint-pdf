# Architecture

imprint is a PDF **toolchain**, not a renderer wrapped around an HTML engine.
The same data model flows from React source → PdfNode IR → laid-out glyph runs →
PDF byte stream, with each stage isolated, testable, and swappable.

## Design principles

1. **No browser, ever.** A PDF library that needs Chromium is an architectural
   failure. imprint runs in Node, Bun, the browser, Vercel Edge, Cloudflare
   Workers, AWS Lambda, and Deno from the same source — verified by the same
   example app deployed to each.
2. **Real Tailwind, not a subset.** The actual Tailwind v4 Oxide compiler
   resolves classes. Plugins, presets, arbitrary values, OKLCH colors, `@theme`
   design tokens all work because the real engine does the work.
3. **Real typography.** HarfBuzz for shaping, ICU4X for segmentation / bidi,
   fontkit for glyph outlines and subsetting, Knuth–Plass for paragraph
   breaking, Plass for page breaking. The Chromium gap is mostly typography; we
   close it explicitly.
4. **Vector everywhere.** Charts arrive as SVG and stay as PDF vector ops.
   Rasterizing for print is a sin.
5. **Open core, honest split.** Apache-2.0 for the engine; BSL 1.1 for the print
   / accessibility / signing features regulated enterprises buy anyway.
6. **Layered, not monolithic.** Each layer has its own package and its own
   tests. The layout pass doesn't know about PDF; the writer doesn't know about
   React.

## Layers

```
┌──────────────────────────────────────────────────────────────────┐
│  Apps                                                            │
│  ├─ examples/next-app, examples/vite-react                       │
│  ├─ examples/cloudflare-worker, examples/bun-server              │
├──────────────────────────────────────────────────────────────────┤
│  Framework adapters                                              │
│  ├─ @imprint/react      (reconciler, components, RSC helpers)    │
│  ├─ @imprint/next       (route handler, edge build)              │
│  ├─ @imprint/vite       (Tailwind + asset plugin, HMR preview)   │
│  └─ @imprint/tailwind   (compile-time + runtime Oxide bridge)    │
├──────────────────────────────────────────────────────────────────┤
│  Tooling                                                         │
│  ├─ @imprint/cli            (render, dev preview, init, validate)│
│  └─ @imprint/eslint-plugin  (lint rules for PDF authoring)       │
├──────────────────────────────────────────────────────────────────┤
│  Enterprise (BSL 1.1)                                            │
│  ├─ @imprint/print  (PDF/X-4, CMYK, ICC via lcms2 WASM)          │
│  ├─ @imprint/sign   (PKCS#7 detached signatures)                 │
│  └─ @imprint/ua     (PDF/UA-1 tagged PDF, structure tree)        │
├──────────────────────────────────────────────────────────────────┤
│  Core                                                            │
│  └─ @imprint/core                                                │
│     ├─ PdfNode IR                                                │
│     ├─ Layout pass (Taffy WASM)                                  │
│     ├─ Inline layout + Knuth–Plass + Plass page breaker          │
│     ├─ Text shaping (HarfBuzz WASM, ICU4X WASM, fontkit)         │
│     ├─ Vector pipeline (SVG → PDF ops, resvg fallback)           │
│     ├─ PDF writer (pdf-lib in v0; imprint-pdf Rust→WASM in v1)   │
│     └─ Asset resolver (fs / fetch / IndexedDB / custom)          │
└──────────────────────────────────────────────────────────────────┘
```

Dependencies flow downward only. `@imprint/core` has no workspace deps.

## Pipeline

### 1. Authoring

```tsx
import { Document, Page } from '@imprint/react';

export function Invoice({ data }: { data: InvoiceData }) {
  return (
    <Document title={`Invoice ${data.id}`}>
      <Page size="A4" className="p-12 font-sans">
        <h1 className="text-3xl font-bold">{data.id}</h1>
        <div className="mt-8 grid grid-cols-12 gap-4">
          {data.lineItems.map((item) => (
            <span key={item.id} className="col-span-8">
              {item.description}
            </span>
          ))}
        </div>
      </Page>
    </Document>
  );
}
```

HTML elements (`<div>`, `<p>`, `<h1>`–`<h6>`, `<ul>`, `<table>`, `<a>`) are
first-class — there is no separate `<View>` or `<Text>` component. Each element
compiles to a `PdfNode` with the appropriate semantic role tag so PDF/UA tagging
works out of the box.

### 2. Reconciliation

A custom React reconciler (using `react-reconciler`, like `@react-pdf` and Ink)
emits an immutable `PdfNode` tree. Every `Document`, `Page`, `Image`, `Svg`,
`Chart`, `TextField`, `Signature`, plus all recognised HTML elements, has
explicit semantics — no DOM speculation.

### 3. Style resolution

`@imprint/tailwind` runs the **real Tailwind v4 Oxide compiler**:

- **Compile-time** — Vite / Webpack / Bun plugin extracts classes, pre-resolves
  into a static CSS map. Zero runtime cost.
- **Runtime fallback** — Oxide WASM resolves classes that the build step
  couldn't see (dynamic class names, runtime-injected content).
- **Hybrid (default)** — compile-time covers static classes, WASM covers the
  rest.

Output CSS is parsed by Lightning CSS (Rust → WASM, the same parser Tailwind v4
uses) and computed styles are mapped onto the `PdfNode` tree.

Properties incompatible with paged output (`hover:`, `focus:`, `transition-*`,
JS animations) are silently dropped, or, in `--strict` mode, surfaced as
warnings. The `print:` variant is **always active** (unlike a browser, which
only triggers it in print preview). Imprint adds custom variants:
`imprint:cmyk-…`, `imprint:bleed-…`, `page:first`, `page:left`, `page:right`.

### 4. Layout pass

Taffy (Rust → WASM, ≈300 KB gzipped) runs the **block + flexbox + CSS Grid**
layout. Inline layout uses Parley-lite (Rust → WASM, from the Linebender stack
used by Blitz / Zed) for shaping and bidi.

Paragraph breaking is **Knuth–Plass** by default (the same algorithm TeX uses):
box / glue / penalty model, badness function, dynamic programming. A greedy
fallback exists for performance-sensitive contexts.

Page breaking is **Plass-style two-pass**: pages laid out as a list with floats,
footnotes, and insertions resolved per page; widows / orphans minimized
globally. This is what TeX does and what every browser still does _not_ do.

### 5. Text & vector pipeline

- **Segmentation / BiDi** — ICU4X (Rust, MIT, WASM-first). UAX #14 line breaks,
  UAX #9 bidirectional algorithm, script detection.
- **Shaping** — HarfBuzz via `harfbuzzjs` (`-DHB_TINY` WASM build). GSUB / GPOS,
  kerning, ligatures, contextual alternates, complex scripts (Arabic Nastaliq,
  Devanagari, Tamil, Thai, Khmer, CJK), variable font axes.
- **Glyph outlines** — fontkit. For variable fonts, axis variations resolved
  cleanly.
- **Subsetting** — HarfBuzz's subsetter via `harfbuzzjs`. A 12 MB CJK font
  becomes ~50 KB of embedded glyphs.
- **Hyphenation** — Liang–Knuth pattern files via `hyphen` (KaTeX's hyphenator).
  Pattern files cached as WASM blobs; lazy-loaded by language.
- **SVG** — vector ops mapped directly to PDF content stream operators. Linear /
  radial gradients become PDF Type 2/3 shadings; SVG masks become PDF soft
  masks; clip paths become clipping paths. Filters and complex masks fall
  through to **resvg** rasterization.
- **CMYK (Enterprise)** — lcms2 (Little CMS) compiled to WASM converts sRGB →
  CMYK against the user's ICC profile.

### 6. PDF writing

| Phase | Backend                     | What it ships                        |
| ----- | --------------------------- | ------------------------------------ |
| v0    | `pdf-lib` (TS)              | Pages, text, images, basic AcroForms |
| v1    | `imprint-pdf` (Rust → WASM) | CMYK, ICC, PDF/X-4, PDF/UA-1, PKCS#7 |

The writer is gated behind a tree-shakeable subpath. The Apache-licensed core
ships only the JS writer; `@imprint/print` opts into the Rust writer.

Streaming: the writer emits objects sequentially and supports
`pipe(WritableStream)` (Node) and `ReadableStream` (Web). For very large
reports, imprint can yield a chunk per page so the first byte ships in <50 ms.

## Isomorphism

The single hardest cross-cutting concern. The strategy:

| Runtime                  | Build target       | WASM loading                              | Asset I/O                 |
| ------------------------ | ------------------ | ----------------------------------------- | ------------------------- |
| Node.js ≥ 20             | ESM + CJS          | `fs.readFileSync` of base64-embedded WASM | `fs` + `fetch`            |
| Bun                      | ESM                | inlined WASM (Bun's WASI)                 | `fs` + `fetch`            |
| Browser                  | ESM + UMD          | `WebAssembly.instantiateStreaming`        | `fetch` + IndexedDB cache |
| Vercel Edge / CF Workers | "standalone" build | WASM imported as static module asset      | `fetch` only              |
| AWS Lambda (Node)        | Node build         | inlined or via Lambda layer               | Lambda layer for fonts    |
| Deno                     | ESM                | Web-standard `fetch`                      | `fetch`                   |

All filesystem I/O is hidden behind an `AssetResolver` interface (`fetch`, `fs`,
`IndexedDB`, custom). Default browser bundle is ≈800 KB gzipped (Yoga 250 KB +
harfbuzz-tiny 200 KB + writer 150 KB + glue) with the print / CMYK / Knuth–Plass
features behind tree-shakeable subpath imports.

Cloudflare Workers use the `imprint/standalone` pattern Satori established: WASM
exported as bytes; the app imports and instantiates it manually, sidestepping
dynamic-load restrictions.

## Cold start

A 4 MB WASM module instantiated on a cold Cloudflare Worker is ≈30–60 ms; on
Vercel Edge ≈40–100 ms. By comparison, Chromium cold starts are 800–2,000 ms.
imprint's perf budget:

- **<100 ms cold** for a 1-page A4 invoice on Cloudflare Workers
- **<25 ms warm** on the same workload
- **Sub-50 ms first byte** for streamed multi-page reports

Achievable based on Satori's measured numbers (10–30 ms warm) plus the
incremental cost of PDF object writing.

## Comparison: real Tailwind in PDFs

| Concern                | `@react-pdf` + `react-pdf-tailwind` | imprint                               |
| ---------------------- | ----------------------------------- | ------------------------------------- |
| Engine                 | translator → `StyleSheet` DSL       | actual Tailwind v4 Oxide compiler     |
| Plugins / presets      | unsupported                         | supported                             |
| Arbitrary values       | partial                             | full (`text-[#bada55]`, `mt-[3.7mm]`) |
| `@theme` design tokens | unsupported                         | supported                             |
| OKLCH colors           | unsupported                         | supported                             |
| CSS Grid               | unsupported                         | supported (Taffy)                     |
| `print:` variant       | partial                             | always active                         |
| Custom variants        | unsupported                         | `imprint:cmyk-…`, `imprint:bleed-…`   |

## Trade-offs explicitly chosen

| Decision                                         | Alternative                            | Why                                                                   |
| ------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------- |
| Taffy (Rust → WASM) over Yoga                    | Yoga is mature, smaller                | We need CSS Grid; Taffy is the only mature open option that ships it  |
| HarfBuzz tiny-build over opentype.js             | opentype.js is JS-only, smaller        | Real complex-script shaping is non-negotiable for international users |
| `pdf-lib` v0 → custom Rust writer v1             | Stay on `pdf-lib` forever              | `pdf-lib` will not ship CMYK / PDF-X / PDF-UA; Enterprise needs them  |
| Real Tailwind compiler (Oxide) over a translator | Translator (à la `react-pdf-tailwind`) | The translator is exactly what we are differentiating against         |
| Knuth–Plass enabled by default                   | Greedy line breaker                    | Output quality is the brand promise; Plass is fast enough             |
| AcroForms only, no XFA                           | Both                                   | XFA is deprecated in PDF 2.0 and disallowed in PDF/A                  |
| Open core (Apache + BSL)                         | Pure OSS or pure proprietary           | Aligns commercial incentives without alienating the dev community     |
| `react-reconciler` over a fork                   | Fork React's reconciler                | One file, well-documented, and `@react-pdf` / Ink prove the pattern   |

## Open questions

Deliberately unresolved — we'll decide them as the implementation lands:

- **Compile-time JSX vs. runtime reconciler.** Babel/SWC plugin to pre-flatten
  static documents at build time, à la Astro's island hoisting?
- **Font subset cache layer.** Per-render? Per-process? Persisted to IndexedDB /
  KV?
- **AcroForm calc / format scripts.** Embed a tiny ES5 evaluator (Prince has
  one) or expose only declarative actions?
- **Math typography.** KaTeX → MathML → glyph runs, embedded `typst-math`, or
  punt to v2?

See [`ROADMAP.md`](ROADMAP.md) for the milestone plan and
[`docs/philosophy.md`](docs/philosophy.md) for why these defaults exist.
