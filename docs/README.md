# Imprint docs

Real Tailwind. Real React. Real typography. PDF anywhere — no Chromium, ever.

## Start here

- **[Overview](overview.md)** — what Imprint is and where it fits
- **[Philosophy](philosophy.md)** — the design decisions and why they were made
- **[Installation](installation.md)** — packages, peer deps, version matrix
- **[Quick start](quick-start.md)** — your first PDF in five minutes
- **[Concepts](concepts.md)** — pipeline, IR, layout, typography on one page
- **[Performance](performance.md)** — measured cold start and throughput numbers
- **[FAQ](faq.md)** — quick answers to common questions
- **[Stability](../STABILITY.md)** — public API, what's internal, semver policy

## Guides

The features, in depth.

- **[Components](guides/components.md)** — `<Document>`, `<Page>`, `<Image>`,
  `<Svg>`, plus first-class HTML elements (`<div>`, `<span>`, `<p>`,
  `<h1>`–`<h6>`, `<a>`, `<img>`, `<table>`, …)
- **[Tailwind](guides/tailwind.md)** — how real Tailwind works inside Imprint;
  variants and dropped properties
- **[Typography](guides/typography.md)** — HarfBuzz shaping, Knuth–Plass,
  variable fonts, CJK, Arabic
- **[Paged layout](guides/paged-layout.md)** — `@page`, `break-before`,
  widows/orphans, running headers, footnotes
- **[Fonts](guides/fonts.md)** — loading, subsetting, Google Fonts, system fonts
- **[Forms (AcroForms)](guides/forms.md)** — `<TextField>`, `<Checkbox>`,
  `<RadioGroup>`, `<Dropdown>`, `<Signature>`
- **[Charts & SVG](guides/charts.md)** — vector charts from Recharts, Visx, D3,
  ECharts
- **[Type safety](guides/typesafety.md)** — strict props, generated types, JSX
  constraints

## Frameworks

- **[Next.js](frameworks/nextjs.md)** — App Router, RSC, route handlers, Edge
  Runtime
- **[Vite](frameworks/vite.md)** — SPA and SSR, virtual modules, HMR
- **[Cloudflare Workers](frameworks/cloudflare.md)** — standalone WASM build,
  cold start
- **[Bun](frameworks/bun.md)** — native WASM, Bun.serve

## Integrations

- **[Recharts](integrations/recharts.md)** — vector chart embedding
- **[D3](integrations/d3.md)** — SVG-to-PDF vector pipeline
- **[Tailwind config](integrations/tailwind-config.md)** — sharing your design
  tokens

## Cookbook

Task-oriented recipes for patterns that actually come up.

- **[Invoice](cookbook/invoice.md)**
- **[Resume](cookbook/resume.md)**
- **[Certificate](cookbook/certificate.md)**
- **[Contract with AcroForm](cookbook/contract.md)**
- **[Financial report (multi-page)](cookbook/report.md)**
- **[Streaming PDFs](cookbook/streaming.md)**
- **[Batch generation](cookbook/batch-generation.md)**
- **[Custom fonts](cookbook/custom-fonts.md)**
- **[Vector charts](cookbook/vector-charts.md)**
- **[CI validation (PDF/UA, PDF/X)](cookbook/ci-validation.md)**

## Migrating

- **[From `@react-pdf/renderer`](migrating/react-pdf-renderer.md)**
- **[From pdfme](migrating/pdfme.md)**
- **[From Puppeteer / headless Chrome](migrating/puppeteer.md)**

## Reference

- **[Configuration](reference/configuration.md)** — `imprint.config.ts` schema
- **[CLI](reference/cli.md)** — every command, every flag
- **[API](reference/api.md)** — typed exports per package
- **[Components](reference/components.md)** — all JSX components, props, and
  defaults

## Examples

- **[`examples/next-app`](../examples/next-app)** — Next.js App Router demo
- **[`examples/vite-react`](../examples/vite-react)** — Vite + React SPA
- **[`examples/cloudflare-worker`](../examples/cloudflare-worker)** — edge PDF
  generation
- **[`examples/bun-server`](../examples/bun-server)** — Bun HTTP server
