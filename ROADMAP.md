# Roadmap

Public, intentionally narrow. Expect cuts and reorders — file an issue if a
milestone matters to you.

## v0.1 — Reconciler + JS pipeline (alpha)

- [x] `@imprint/core` — PdfNode IR, layout types, asset resolver, hashing
- [x] React reconciler emitting PdfNode IR
- [x] `<Document>`, `<Page>`, `<Image>`, `<Svg>` plus first-class HTML elements
      (`<div>`, `<p>`, `<h1>`–`<h6>`, `<span>`, `<a>`, `<img>`, `<table>`,
      `<ul>`, `<ol>`, `<li>`, `<section>`, `<article>`, `<nav>`, `<header>`,
      `<footer>`, `<main>`, `<figure>`, `<blockquote>`, `<pre>`, `<code>`,
      `<strong>`, `<em>`)
- [x] `<Header>` / `<Footer>` running components — re-laid out per page
- [x] `<Watermark>` — drawn behind page content on every page
- [x] `<Bookmark>` — registers PDF outline + acts as a named destination
- [x] `<PageNumber>` and `<TotalPages>`
- [x] Taffy WASM (Block + Flexbox + Grid)
- [x] HarfBuzz WASM shaping
- [x] Bidi reordering for mixed-direction text
- [x] pdf-lib writer with subset embedding
- [x] Greedy line breaking and Knuth–Plass
- [x] `text-indent`, `line-clamp`, `text-overflow: ellipsis`, `overflow: hidden`
      with proper PDF clip
- [x] `@imprint/cli` — `init`, `render`, `validate`, `dev`
- [x] Node.js + browser builds; standalone build for edge runtimes
- [x] Apache-2.0 license (BSL for the enterprise tier)
- [x] Working examples: invoice, sales-invoice, quarterly-report; vite-react,
      next-app, bun-server, cloudflare-worker harnesses

## v0.2 — Tailwind + framework adapters

- [x] `@imprint/tailwind` — Vite / Webpack / Bun compile-time plugin
- [x] `@imprint/tailwind/runtime` — Oxide WASM fallback
- [x] `@imprint/next` — App Router route handler, edge build, asset bundling
- [x] `@imprint/vite` — Tailwind plugin
- [ ] `imprint dev` — live preview server with element inspector
- [x] `examples/next-app`, `examples/vite-react` end-to-end
- [ ] Custom Tailwind variants — `imprint:cmyk-…`, `imprint:bleed-…`,
      `page:first`, `page:left`, `page:right`

## v0.3 — Typography depth

- [x] Knuth–Plass paragraph breaking
- [ ] Auto hyphenation for 12 languages
- [ ] Variable font support (axis controls in Tailwind theme)
- [x] Latin, Greek, Cyrillic shaping with HarfBuzz
- [ ] Arabic, Hebrew shaping (bidi reorder shipped; full GSUB pending)
- [ ] Devanagari, Thai, CJK shaping + vertical writing mode
- [ ] Plass-style two-pass page breaking (widows / orphans / footnotes)

## v0.4 — Forms + charts + drawing

- [x] AcroForm components — `<TextField>`, `<Checkbox>`, `<RadioGroup>`,
      `<Dropdown>`, `<Signature>`, `<Button>`
- [x] External URI links and in-document `#anchor` links via named destinations
- [x] File attachments via `Document.props.embeds`
- [x] CSS `transform`, per-corner `border-radius`, `box-shadow`,
      `background-image`, `object-position`, `aspect-ratio`
- [ ] `<Chart>` adapters for Recharts, Visx, ECharts, Observable Plot
- [ ] Vector SVG → PDF (basic embedding works; gradients, masks, clipping paths
      pending)
- [ ] resvg WASM fallback for filters and complex masks
- [ ] `examples/cloudflare-worker` end-to-end with sub-100 ms cold benchmark
      verified

## v0.5 — Linting + type safety + testing

- [x] `@imprint/eslint-plugin` (initial rule set)
- [ ] Codegen'd page-size unions, font unions
- [ ] Editor diagnostics for Tailwind classes that resolve to paged-incompatible
      CSS
- [x] `@imprint/e2e` — end-to-end test harness with PDF text extraction,
      structural inspection, and visual snapshot infrastructure
- [ ] `@imprint/testing` — Vitest / Jest matcher `toMatchPdfSnapshot()` for
      visual regression testing in user projects
- [x] `<Bookmark>` component + named destinations
- [x] Document metadata API — title, author, subject, keywords
- [ ] XMP metadata (required for PDF/A and enterprise DMS ingestion)
- [x] Internal cross-references — named destinations and `<a href="#id">`
      within-document links

## v1.0-beta — Enterprise stack (BSL)

- [ ] `@imprint/print` — Rust + WASM `imprint-pdf` writer
- [ ] PDF/X-4 + PDF/X-4p output intent
- [ ] CMYK pipeline, ICC profile embedding (lcms2 WASM)
- [ ] Spot colors, overprint, bleed / trim / registration marks
- [ ] `@imprint/ua` — PDF/UA-1 tagged PDF
- [ ] veraPDF CI validation harness
- [ ] `@imprint/sign` — PKCS#7 detached signatures
- [ ] PDF encryption — AES-256, owner / user passwords, permission flags
      (print-only, no-copy, no-modify) for confidential docs
- [ ] PDF/A-2b, PDF/A-3 with embedded XML (factur-X / ZUGFeRD)
- [ ] Streaming generation; sub-100 ms cold edge benchmark verified
- [ ] All packages public on npm

## v1.0 — Stability & ergonomics

- [ ] Public API freeze
- [ ] Migration guides from `@react-pdf/renderer`, Puppeteer, DocRaptor, jsPDF
- [ ] Performance — sub-50 ms warm on 1-page A4 invoice
- [ ] More cookbook recipes — packing slips, certificates, transcripts,
      brochures

## Beyond v1

- PDF/UA-2 + Well-Tagged PDF
- Math typography (KaTeX → MathML → glyph runs, or embedded `typst-math`)
- Templates marketplace (paid templates; imprint takes 15–30%)
- Visual editor (à la pdfme designer) that round-trips with code
- AI template generator: "describe your invoice / upload a sample → JSX
  template"
- Vue, Svelte, Solid adapters (the IR is framework-agnostic)
