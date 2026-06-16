# Roadmap

Public, intentionally narrow. Expect cuts and reorders — file an issue if a
milestone matters to you.

## v0.1 — Reconciler + JS pipeline (alpha)

- [x] `@imprint-pdf/core` — PdfNode IR, layout types, asset resolver, hashing
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
- [x] `@imprint-pdf/cli` — `init`, `render`, `validate`, `dev`
- [x] Node.js + browser builds; standalone build for edge runtimes
- [x] Apache-2.0 license
- [x] Working examples: invoice, sales-invoice, quarterly-report; vite-react,
      next-app, bun-server, cloudflare-worker harnesses

## v0.2 — Tailwind + framework adapters

- [x] `@imprint-pdf/tailwind` — Vite / Webpack / Bun compile-time plugin
- [x] `@imprint-pdf/tailwind/runtime` — Oxide WASM fallback
- [x] `@imprint-pdf/next` — App Router route handler, edge build, asset bundling
- [x] `@imprint-pdf/vite` — Tailwind plugin
- [x] `imprint dev` — live preview server with element inspector (PdfNode IR +
      post-layout geometry over JSON, SSE live reload)
- [x] `examples/next-app`, `examples/vite-react` end-to-end
- [x] Custom Tailwind variants — `page-first:`, `page-left:`, `page-right:`
      (runtime-applied), `imprint-bleed:`, `imprint-cmyk:` (registered; runtime
      activates with the `@imprint-pdf/print` pipeline)

## v0.3 — Typography depth

- [x] Knuth–Plass paragraph breaking
- [x] Auto hyphenation for 12 languages (en-us, en-gb, de, fr, es, it, pt, nl,
      da, sv, nb, fi)
- [x] Variable font support (`font-variation-settings`, `font-stretch` axes)
- [x] Latin, Greek, Cyrillic shaping with HarfBuzz
- [x] Arabic, Hebrew shaping (bidi reorder + script-aware GSUB)
- [x] Devanagari, Thai, CJK shaping + vertical writing mode
- [x] Plass-style two-pass page breaking (widows / orphans; footnotes deferred
      to v0.4)
- [x] `@imprint-pdf/font` — Google Fonts, Bunny Fonts, Fontsource, and local
      providers behind a single `loadFont(provider, family, opts)` API

## v0.4 — Forms + charts + drawing

- [x] AcroForm components — `<TextField>`, `<Checkbox>`, `<RadioGroup>`,
      `<Dropdown>`, `<Signature>`, `<Button>`
- [x] External URI links and in-document `#anchor` links via named destinations
- [x] File attachments via `Document.props.embeds`
- [x] CSS `transform`, per-corner `border-radius`, `box-shadow`,
      `background-image`, `object-position`, `aspect-ratio`
- [x] `@imprint-pdf/chart` adapter — SSR Recharts / Visx / Observable Plot /
      ECharts to SVG, embed via `<Svg>`
- [x] Vector SVG → PDF — shapes, paths (M/L/H/V/C/S/Q/T/A/Z incl.
      arc-to-Bezier), linear / radial gradients via PDF Type 2/3 shading dicts,
      `clip-path` via `W`/`W*`, transforms, opacity
- [x] `@imprint-pdf/svg-rasterize` — opt-in resvg WASM fallback for SVGs that
      use `<filter>`, soft `<mask>`, or `<foreignObject>`
- [x] `examples/cloudflare-worker` end-to-end — `wrangler.toml` +
      `scripts/bench.ts` reporting cold and warm `p50/p95/p99`
- [x] cloudflare-worker `bench:verify` harness — multi-cold sampling, JSON
      results, fails non-zero on threshold breach
- [ ] cloudflare-worker sub-100 ms cold benchmark verified on a real deploy
      (deploy +
      `pnpm --filter @imprint-pdf/example-cloudflare-worker bench:verify <url>`;
      commit the resulting `bench-results.json` to flip this box)

## v0.5 — Linting + type safety + testing

- [x] `@imprint-pdf/eslint` — flat-config plugin with `no-unsupported-css`,
      `no-missing-alt`, `no-dynamic-class-without-safelist`,
      `no-hover-variants`, `no-paged-incompatible`, `require-page-in-document`
- [x] Codegen'd page-size + font unions — `PageSize` derived from `PAGE_SIZES`;
      `HYPHEN_LANGUAGES` regenerated from `data/hyphen/`
- [x] `@imprint-pdf/e2e` — end-to-end test harness with PDF text extraction,
      structural inspection, and visual snapshot infrastructure
- [x] `@imprint-pdf/testing` — Vitest / Jest matcher `toMatchPdfSnapshot()` for
      visual regression testing in user projects
- [x] `<Bookmark>` component + named destinations
- [x] Document metadata API — title, author, subject, keywords
- [x] XMP metadata (required for PDF/A and DMS ingestion)
- [x] Internal cross-references — named destinations and `<a href="#id">`
      within-document links

## v1.0-beta — Compliance & print stack

- [x] `@imprint-pdf/print` — output intents, CMYK pipeline, ICC profile
      embedding
- [x] PDF/X-4 + PDF/X-4p output intent
- [x] CMYK pipeline, ICC profile embedding (lcms2 WASM-ready; rgb→CMYK
      conversion ships today)
- [x] Spot colors, overprint, bleed / trim / registration marks
- [x] `@imprint-pdf/ua` — PDF/UA-1 tagged PDF, structure tree, alt text, role
      map
- [x] veraPDF CI validation harness (`.github/workflows/verapdf.yml`)
- [x] `@imprint-pdf/sign` — PKCS#7 detached signatures (`signWithByteRange`,
      `signBuffer`)
- [x] PDF encryption — AES-256 V=5/R=6, owner / user passwords, permission flags
- [x] PDF/A-2b, PDF/A-3 with embedded XML (factur-X / ZUGFeRD)
- [x] `@imprint-pdf/react` chunked `renderToStream` for sub-100 ms TTFB
- [ ] All packages public on npm

## v1.0 — Stability & ergonomics

- [ ] Public API freeze
- [ ] Migration guides from `@react-pdf/renderer`, Puppeteer, DocRaptor, jsPDF
- [ ] Performance — sub-50 ms warm on 1-page A4 invoice
- [ ] More cookbook recipes — packing slips, certificates, transcripts,
      brochures

## v0.x — Python adapter (Upcoming)

A first-class Python front end emitting the same `PdfNode` IR the React
reconciler emits. Same engine, no Node subprocess, no headless browser. Docs
proposal lives at [`docs/python/`](docs/python/README.md).

**Hard prerequisites** (all required to start):

- [ ] IR contract frozen and versioned (currently an internal artifact)
- [ ] IR JSON schema published and validated in CI
- [ ] Engine compiled as a standalone WASM module (no JS glue) consumable from
      `wasmtime-py`

**Phase 1 — Runtime + callable API on the v0 stack**

The floor. Ships something usable in pure `.py` before any tooling exists.

- [ ] `imprint-pdf` PyPI package — `Document`, `Page`, HTML callables (`Div`,
      `H1`, …), imprint primitives (`Image`, `Svg`, `Chart`, AcroForm
      components, running header/footer, watermark, bookmark, page-number)
- [ ] `pdf()` and `pdf_async()` returning `bytes` / `AsyncIterator[bytes]`
- [ ] `imprint.toml` config + asset resolver (`filesystem`, `s3`, `gcs`, custom)
- [ ] `imprint init` / `imprint render` / `imprint validate` via a Python CLI
      entry point (no Node)
- [ ] Wheels: manylinux_2_28 (x86_64, aarch64), macOS 12+ universal, Win 10+
- [ ] Cold start ≤ 250 ms on AWS Lambda ARM64 with `[print]` extra installed

**Phase 2 — `.impy` file format + compiler**

The canonical authoring surface. JSX/TSX for Python.

- [ ] Lexer that interleaves Python tokens with JSX markup tokens
- [ ] JSX parser supporting elements, attributes, fragments, spreads,
      `{expression}` interpolation, `if` / `for` / `while` control flow inside
      markup
- [ ] Lowering pass: JSX AST → Python AST (`<div class="p">x</div>` →
      `Div("x", class_="p")`)
- [ ] `sys.meta_path` finder + `__pycache__/<name>.impy.<hash>.pyc` caching
- [ ] `linecache` integration so tracebacks point to `.impy` source lines
- [ ] `imprint show <file.impy>` — print generated Python
- [ ] `imprint build` / `imprint build --watch` — pre-compile `.impy` → `.py`
      for production deploys
- [ ] Black integration for embedded Python statement blocks
- [ ] Compile budget: ≤ 5 ms for a 200-line file, cold

**Phase 3 — Language server + editor plugins**

The reason `.impy` is worth a file extension.

- [ ] `imprint-lsp` — Rust + Salsa, demand-driven incremental analysis
- [ ] Auto-generated `.pyi` per `.impy` so mypy / pyright / pylance see fully
      typed components without a custom plugin
- [ ] Diagnostics: unknown elements, unknown props, prop type mismatches,
      missing required props, malformed JSX
- [ ] Completions: element names, props, Tailwind classes (via Tailwind LSP),
      imported component names
- [ ] Hover: prop types from dataclasses, component docstrings
- [ ] Jump-to-definition across `.py` ↔ `.impy`
- [ ] First-party editor plugins:
  - [ ] VS Code (`imprint-pdf.imprint-vscode`)
  - [ ] Zed (`imprint-pdf/imprint-zed`)
  - [ ] JetBrains (`imprint-pdf-pycharm`)
  - [ ] Neovim — `nvim-lspconfig` snippet
  - [ ] Helix — `languages.toml` snippet
- [ ] `imprint dev` — preview server with hot reload on `.impy` + CSS + `.py`
      changes; reuses the inspector protocol shared with the JS dev server

**Phase 4 — Framework adapters**

- [ ] `imprint-pdf-django` — `PdfResponse`, `StreamingPdfResponse`,
      `PdfResponseMixin`, `as_pdf` model helper, admin action
- [ ] `imprint-pdf-fastapi` — `PdfResponse`, `StreamingPdfResponse`,
      `render_to_storage` background helper
- [ ] `imprint-pdf-flask` — `send_pdf`
- [ ] `imprint-pdf-litestar` — `PdfResponse`
- [ ] `imprint-pdf-celery` — `@pdf_task` decorator, S3/GCS upload helper
- [ ] `imprint-pdf-airflow` — `RenderPdfOperator` with dynamic mapping
- [ ] `imprint-pdf-jupyter` — `display_pdf` inline-iframe preview

**Phase 5 — PyO3 bindings on v1 writer** (blocked on
[v1.x](#v1x--custom-pdf-writer-gated) Phase 1)

- [ ] Native compiled extension via PyO3 for the writer
- [ ] Same public API; `pdf()` switches backends behind a feature flag
- [ ] ~30–40% lower latency on multi-page documents

**Out of scope for v0.x Python:**

- No headless browser fallback. Ever.
- No subprocess to Node CLI.
- No source-rewriting decorator on `.py` files (Pyxl-style). The `.impy`
  extension scopes the problem so existing tooling isn't broken.
- No Jinja-style template-string DSL. Templates are typed source files.
- No React-in-Python — components are plain functions.

## v1.x — Custom PDF writer (gated)

Replace `pdf-lib` with a native object model, content-stream emitter, font
subsetter, and image embedder. ~5-8k LOC of new code with byte-level correctness
invariants against PDF/A and PDF/UA validators, so it only ships when funding
and demand justify the time. **Phase 0** (a passthrough facade under
`@imprint-pdf/core/pdfio` so consumers stop importing `pdf-lib` directly) starts
as soon as the gate is met — every week we wait, the pdf-lib-typed API surface
grows.

Gate (all three required to start Phase 0):

- [ ] **≥ 1,000 GitHub stars**
- [ ] **Sustained funding** — GitHub Sponsors / Open Collective / Polar at a
      level that covers 2–3 focused days/month of work
- [ ] **≥ 3 issues** citing `pdf-lib` (bundle size, blocker bug, missing
      feature) — see the
      [`migration-from-pdf-lib`](https://github.com/tamimbinhakim/imprint-pdf/labels/migration-from-pdf-lib)
      label

Phases once gated:

- [ ] **Phase 0** — passthrough facade in `@imprint-pdf/core/pdfio`; migrate
      `print/`, `ua/`, `sign/`, and `PdfPostProcessHook` to import from it
- [ ] **Phase 1** — native `PDFContext`, xref table, indirect-object serializer;
      target PDF 2.0 (ISO 32000-2)
- [ ] **Phase 2** — content-stream operator emitter; replace
      `drawText/Image/Rectangle/Line/SvgPath`
- [ ] **Phase 3** — font embedding (CFF/TrueType subsetter on `fontkit`),
      standard 14 AFM tables, `/ToUnicode` CMap
- [ ] **Phase 4** — JPEG (`/DCTDecode`) and PNG (transcode to `/FlateDecode` +
      `/SMask` for alpha) embedders
- [ ] **Phase 5** — drop `pdf-lib` + `@pdf-lib/fontkit` dependencies

## Beyond v1

- PDF/UA-2 + Well-Tagged PDF
- Math typography (KaTeX → MathML → glyph runs, or embedded `typst-math`)
- Templates marketplace (paid templates; imprint-pdf takes 15–30%)
- Visual editor (à la pdfme designer) that round-trips with code
- AI template generator: "describe your invoice / upload a sample → JSX
  template"
- Vue, Svelte, Solid adapters (the IR is framework-agnostic)
