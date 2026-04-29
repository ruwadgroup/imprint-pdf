# Roadmap

Public, intentionally narrow. Expect cuts and reorders — file an issue if
a milestone matters to you.

## v0.1 — Reconciler + JS pipeline (alpha)

- [ ] `@imprint/core` — PdfNode IR, layout types, asset resolver, hashing
- [ ] React reconciler emitting PdfNode IR
- [ ] `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`, `<Svg>`,
      plus HTML aliases (`<div>`, `<p>`, `<h1>`…, `<ul>`, `<table>`,
      `<a>`)
- [ ] `<Header>` / `<Footer>` running components — repeated across pages
      via CSS `position: running()`; supports page numbers, doc title,
      chapter name
- [ ] Taffy WASM (Block + Flexbox + Grid)
- [ ] HarfBuzz WASM shaping for Latin / Greek / Cyrillic; CJK behind a
      flag
- [ ] `pdf-lib` writer with subset embedding
- [ ] Greedy line breaking (Knuth–Plass behind opt-in)
- [ ] `@imprint/cli` — `init`, `render`, `validate`
- [ ] Node.js + browser builds; Cloudflare Workers "standalone" build
- [ ] Apache-2.0 license
- [ ] Working examples: invoice, statement, certificate, resume

## v0.2 — Tailwind + framework adapters

- [ ] `@imprint/tailwind` — Vite / Webpack / Bun compile-time plugin
- [ ] `@imprint/tailwind/runtime` — Oxide WASM fallback
- [ ] `@imprint/next` — App Router route handler, edge build, asset bundling
- [ ] `@imprint/vite` — Tailwind plugin + HMR preview server
- [ ] `imprint dev` — live preview server with element inspector
- [ ] `examples/next-app`, `examples/vite-react` end-to-end
- [ ] Custom Tailwind variants — `imprint:cmyk-…`, `imprint:bleed-…`,
      `page:first`, `page:left`, `page:right`

## v0.3 — Typography depth

- [ ] Knuth–Plass paragraph breaking on by default
- [ ] Auto hyphenation for 12 languages
- [ ] Variable font support (axis controls in Tailwind theme)
- [ ] Arabic, Hebrew, Devanagari, Thai shaping
- [ ] CJK shaping + vertical writing mode
- [ ] Plass-style two-pass page breaking (widows / orphans / footnotes)

## v0.4 — Forms + charts

- [ ] AcroForm components — `<TextField>`, `<Checkbox>`, `<RadioGroup>`,
      `<Dropdown>`, `<Signature>`, `<Button>`
- [ ] `<Chart>` adapters for Recharts, Visx, ECharts, Observable Plot
- [ ] Vector SVG → PDF (gradients, masks, clipping paths)
- [ ] resvg WASM fallback for filters and complex masks
- [ ] `examples/cloudflare-worker` end-to-end with sub-100 ms cold
      benchmark verified

## v0.5 — Linting + type safety

- [ ] `@imprint/eslint-plugin` — `no-unsupported-css`, `no-overflow`,
      `tailwind-classes`, `aria-on-imprint-elements`
- [ ] Codegen'd page-size unions, font unions
- [ ] Editor diagnostics for Tailwind classes that resolve to
      paged-incompatible CSS
- [ ] `@imprint/testing` — Vitest / Jest matcher `toMatchPdfSnapshot()`
      for visual regression testing of PDF output
- [ ] `<Bookmark>` component + auto-generation from heading hierarchy for
      PDF outline / navigation panel
- [ ] Document metadata API — title, author, subject, keywords, XMP
      (required for PDF/A and enterprise DMS ingestion)
- [ ] Internal cross-references — named destinations and `<a href="#id">`
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
- [ ] Migration guides from `@react-pdf/renderer`, Puppeteer, DocRaptor,
      jsPDF
- [ ] Performance — sub-50 ms warm on 1-page A4 invoice
- [ ] More cookbook recipes — packing slips, certificates, transcripts,
      brochures

## Beyond v1

- PDF/UA-2 + Well-Tagged PDF
- Math typography (KaTeX → MathML → glyph runs, or embedded
  `typst-math`)
- Templates marketplace (paid templates; imprint takes 15–30%)
- Visual editor (à la pdfme designer) that round-trips with code
- AI template generator: "describe your invoice / upload a sample → JSX
  template"
- Vue, Svelte, Solid adapters (the IR is framework-agnostic)
