# Research: imprint-pdf API surface + existing example glue (captured at commit 1ec7185)

Source of the snippets and contract in `PRD.md` / `arch.md`. All verified by
reading the repo at `1ec7185`.

## `pdf()` entry points (the three forms an adapter picks from)

- **`@imprint-pdf/react`** - `packages/react/src/pdf.ts`. Node host (pulls
  pdf-lib native). Overloads: `pdf(el, {as?:'response'}) => Response` (default),
  `{as:'bytes'} => Uint8Array`, `{as:'stream'} => ReadableStream`. Options:
  `filename`, `disposition: 'inline'|'attachment'`, plus `RenderOptions`. Builds
  the `Response` with `Content-Type: application/pdf`, `Content-Disposition`,
  `Content-Length`.
- **`@imprint-pdf/react/standalone`** - `packages/react/src/standalone.ts` +
  `pdf-standalone.ts`. Edge/browser, pure WASM, **no `node:*`**. Same overloads.
  Re-exports all components.
- **`@imprint-pdf/next`** - `packages/next/src/index.ts`. `pdf()` auto-detects
  edge vs node (`process.env.NEXT_RUNTIME === 'edge'` or
  `globalThis.EdgeRuntime`) and dynamically imports `@imprint-pdf/react` (node)
  or `@imprint-pdf/react/standalone` (edge). Deprecated helpers still exported:
  `renderToServer`, `renderToEdge`, `createPdfResponse`.

## Components (from `@imprint-pdf/react`, re-exported by `/standalone`)

`Document, Page, Image, Svg, Chart, Header, Footer, PageNumber, TotalPages, Watermark, Bookmark, Link, Button, Form, TextField, Checkbox, RadioGroup, Dropdown, Signature`.
Source list: `packages/react/src/standalone.ts` export block. First-class HTML
elements (`div, span, p, h1-h6, a, img, table, ...`) via JSX (README). Vector
charts: `@imprint-pdf/chart` (`packages/chart`) feeding `<Chart>`.

## Existing examples (glue shapes + seed content)

- `examples/next-app/src/app/api/invoice/route.tsx`:
  `export const GET = () => pdf(<Invoice .../>, { filename })` with
  `export const runtime = 'nodejs'`. Imports `pdf` from `@imprint-pdf/next`.
- `examples/next-app/src/templates/invoice.tsx`: `Invoice` component
  (Document/Page + Tailwind) - style baseline.
- `examples/cloudflare-worker/`, `examples/bun-server/`
  (`src/index.ts`+`index.tsx`), `examples/vite-react/src/main.tsx`: the edge /
  Bun / browser glue shapes.
- `examples/pdf-test/src/{index.tsx,templates/{Invoice,Report,SalesInvoice}.tsx,data/*,components/Table.tsx}`:
  CLI-ish harness rendering templates to `./out/`. Seed content for the fixtures
  package; repurpose into `examples/node-cli`.
- `packages/bench/src/fixtures/{invoice,report}.tsx`: duplicate fixtures the
  bench suite renders - to be replaced by `@imprint-pdf/fixtures` (Unit 4).

## Workspace / CI facts

- `pnpm-workspace.yaml`: globs `packages/*` + `examples/*`; `catalog:` has
  `typescript`, `react@^19`, `react-dom`, `@types/*`, `vitest`, `tsx`, etc.
- `turbo.json`: `typecheck` task `dependsOn ["^build"]`; runs only where a
  `typecheck` script exists. `test` task too.
- `.github/workflows/ci.yml`: build step is
  `turbo run build --filter='!@imprint-pdf/example-*'` (examples excluded -
  known `@imprint-pdf/tailwind` `createRequire`-in-browser-bundle bug). Then
  `pnpm typecheck`, `pnpm lint`, `pnpm test:ci`. Matrix: ubuntu/macos/windows ×
  node 20/22.
- **Gate gap**: no `examples/*` package declares `typecheck`, so examples are
  currently un-gated. Adding `typecheck` scripts closes it with no CI yaml
  change. `@imprint-pdf/fixtures` lives in `packages/` precisely so it is NOT
  under the `example-*` build exclusion (bench depends on it).
- Existing examples pin `@imprint-pdf/*` at `1.0.0-alpha.4` (not `workspace:*`);
  confirm at execution time. Internal `@imprint-pdf/fixtures` consumes the libs
  as `workspace:*` since it is a sibling package.

## The six glue categories → see `arch.md` §4 (canonical snippets) and §5 (26-runtime table).
