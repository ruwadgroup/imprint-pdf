---
id: 002
title:
  Runtime test/bench/DX matrix - internal @imprint-pdf/fixtures + 26 thin
  per-runtime adapters
slug: 002-runtime-samples-matrix
status: ready
tags: [area:testing, area:examples, type:feat, theme:runtime-coverage, theme:dx]
priority: P1
severity: medium
effort: L
risk:
  26 runtime packages balloon install/CI time; framework type-deps may not all
  typecheck cleanly on first pass; render behaviour differs per runtime (WASM
  load) so typecheck alone won't catch every regression.
planned_at: { commit: 1ec7185, date: 2026-06-29 }
depends_on: []
mockups:
  interface: null
  architecture: arch.md
research: research/
---

# PRD 002: Runtime test/bench/DX matrix - internal @imprint-pdf/fixtures + 26 thin per-runtime adapters

> **Executor instructions**: This PRD is portable - everything you need is in
> this file and the linked architecture mockup (`arch.md`). Follow it top to
> bottom. Run every command in the AI verification checklist and confirm the
> expected result before reporting done. If a STOP condition fires, stop and
> report - do not improvise.

## Problem

imprint-pdf's entire pitch is "PDF anywhere - same runtime as the rest of your
code" (`README.md`). But the repo only exercises that for **four** runtimes
today (`examples/`: `next-app`, `cloudflare-worker`, `bun-server`, `vite-react`,
plus a React-18 smoke), against three trivial use-cases (Invoice, Report,
SalesInvoice). The "runs everywhere" claim is largely **untested** - nothing in
CI proves the library compiles and renders against the dozens of host frameworks
and runtimes users actually deploy to (tRPC, Express, Fastify, NestJS, Remix,
SvelteKit, Astro, AWS Lambda, Deno, Electron, ...).

This is **internal testing infrastructure**, not a user-facing product. These
samples are **not** a public/installable library and are **not** marketing
collateral; they are a cross-runtime test matrix the project owns and runs. (A
user is free to read or copy code from them, but that is incidental - we do not
optimise for it, and the templates package is private and never published.)

The plan: one **internal fixtures package** (`@imprint-pdf/fixtures`, `private`,
never published) holding a rich set of use-case documents authored once,
consumed by three internal harnesses - the **test matrix**, the **benchmark
suite** (`packages/bench`), and **many thin per-runtime adapters**. This is the
structure the maintainer chose - shared internal package consumed by N
consumers - and it is correct precisely because these are fixtures, not
copy-paste starters: DRY beats per-folder self-containment when nobody is meant
to lift a single folder out.

Purpose, in priority order:

1. **Test - runtime coverage.** Prove (compile-time now via typecheck,
   render-time via the fixtures' own vitest tests) that the library works across
   each runtime. The matrix _is_ the test surface.
2. **Benchmark.** Feed the existing `packages/bench` from the same corpus, so
   performance is measured against a real, growing document set instead of two
   ad-hoc fixtures.
3. **DX evaluation.** Each adapter is a probe of how good the developer
   experience is for that runtime - how much glue, what friction - captured as
   lightweight per-adapter `DX notes` (see `arch.md` §8). Weak-DX runtimes
   become follow-up library work.

There is **no gallery / showcase / marketing surface** - that was explicitly
cut.

## Mockups

- **Interface** - `null`. There is no user-facing UI; the deliverables are a
  fixtures package, test/bench wiring, and per-runtime adapter folders. (An
  earlier `gallery` idea was dropped.)
- **Architecture** - `arch.md`: the load-bearing mockup. The runtime-agnostic
  fixtures-package contract, the six glue-pattern categories with canonical
  snippets, the complete 26-runtime table with category mapping, the CI
  typecheck + render-test wiring, the bench integration, and the "add a runtime"
  recipe. Read it before writing any code.

## Context (self-contained)

### The library API the adapters depend on (verified at `1ec7185`)

`pdf()` exists in **three** forms; an adapter picks one:

- `@imprint-pdf/react` - Node host (pulls pdf-lib native).
  `packages/react/src/pdf.ts`: `pdf(element, options?)` returns `Response`
  (default), or `Uint8Array` with `{ as: 'bytes' }`, or `ReadableStream` with
  `{ as: 'stream' }`. Also `filename` and `disposition: 'inline' | 'attachment'`
  options.
- `@imprint-pdf/react/standalone` - edge/browser, pure WASM, **no `node:*`**
  imports. `packages/react/src/standalone.ts` / `pdf-standalone.ts`: same
  `pdf()` overloads. Use this for Cloudflare, Vercel Edge, Deno, Bun, browser,
  AWS Lambda.
- `@imprint-pdf/next` - `packages/next/src/index.ts`: `pdf()` that auto-detects
  edge vs node (`NEXT_RUNTIME==='edge'` or `globalThis.EdgeRuntime`) and
  dynamically imports the right entry. Next.js adapters use this.

Components are exported from `@imprint-pdf/react` (and re-exported by
`/standalone`):
`Document, Page, Image, Svg, Chart, Header, Footer, PageNumber, TotalPages, Watermark, Bookmark, Link, Button, Form, TextField, Checkbox, RadioGroup, Dropdown, Signature`
(see `packages/react/src/standalone.ts` export list). First-class HTML elements
(`div, span, p, h1-h6, a, img, table, ...`) work via JSX per `README.md`. Vector
charts: `@imprint-pdf/chart` (`packages/chart`) feeding `<Chart>`.

**The contract that makes one document body work in every consumer**:
`@imprint-pdf/fixtures` imports **only components and types** from
`@imprint-pdf/react` - it must **never** import or call `pdf()` in `src/**`
(outside `*.test.ts`). Each consumer (adapter / test / bench) calls the `pdf()`
entry appropriate to its runtime. See `arch.md` §2.

### Existing examples (the shape to copy and migrate)

`examples/next-app/src/templates/invoice.tsx` - an `Invoice` component taking
typed props, using `Document`/`Page` + Tailwind classes (read it; it is the
style baseline). `examples/next-app/src/app/api/invoice/route.tsx` - the thin
glue: `export const GET = () => pdf(<Invoice .../>, { filename })`.
`examples/cloudflare-worker/src/index.ts` + `index.tsx`,
`examples/bun-server/src/index.ts` + `index.tsx`,
`examples/vite-react/src/main.tsx` - the other three glue shapes.
`examples/pdf-test/src/{index.tsx,templates/*,data/*,components/Table.tsx}` - a
CLI-ish harness that renders templates to `./out/`; its templates (Invoice,
Report, SalesInvoice) and `components/Table.tsx` are the seed content to fold
into the shared package.

### Workspace + CI facts (verified)

- `pnpm-workspace.yaml` globs `packages/*` **and** `examples/*`; a new
  `packages/fixtures` dir is auto-included as a workspace package. There is a
  `catalog:` for `typescript`, `react@^19`, `@types/node`, etc. - new packages
  should use `catalog:` where a catalog entry exists.
- `turbo.json` defines a `typecheck` task (`dependsOn: ["^build"]`).
  `pnpm typecheck` = `turbo run typecheck` runs it across **every** workspace
  package that declares a `typecheck` script.
- **The gate gap**: today no `examples/*` package declares a `typecheck` script,
  and `.github/workflows/ci.yml` builds with
  `--filter='!@imprint-pdf/example-*'` (a known browser-bundle `createRequire`
  bug). So examples are currently **un-gated**. Adding a
  `"typecheck": "tsc --noEmit"` to each example is what closes the gap - no CI
  yaml edit is needed for the typecheck job because it already runs
  `pnpm typecheck` workspace-wide.
- Existing examples use `"@imprint-pdf/*": "1.0.0-alpha.4"` version specifiers,
  **not** `workspace:*` (see `examples/next-app/package.json`). New examples
  that consume `@imprint-pdf/fixtures` must reference it as `"workspace:*"`; for
  the published libs, **match whatever the existing examples use** (currently
  the pinned alpha version) to avoid changing release wiring - confirm the
  current value at execution time and copy it.

### Sources

See `research/` for the captured API/export surface and the existing-example
glue snippets used to build `arch.md`'s category table.

## Non-goals

- **In scope: Node-level render tests of the templates package** (Unit 1.8) -
  render every template to bytes in vitest and assert a valid, non-trivial PDF.
  This is the core test value and is cheap.
- **Out of scope: per-runtime render-smoke in CI** (actually executing all 26
  frameworks - Bun/Deno/edge/browser - and asserting their output in CI). The
  per-runtime gate this PRD ships is **typecheck** (compile proof against each
  runtime's types). A follow-up PRD adds runtime-specific render execution where
  it catches things typecheck cannot (e.g. WASM load under Bun/Deno/Workers).
  Deterministic sample data is built now so that follow-up is cheap.
- **Not a public/installable library or marketing site.**
  `@imprint-pdf/fixtures` is `private` and never published; no "Deploy" buttons,
  no npm release, no docs positioning it as a user product. A `docs/examples.md`
  index is fine as an internal map, but do not frame these as supported
  starters.
- **Do not fix the examples `build` bug.** The CI `build` job keeps
  `--filter='!@imprint-pdf/example-*'`. Do not attempt to fix the
  `@imprint-pdf/tailwind` `createRequire`-in-browser-bundle issue; it is a
  separate PRD.
- **No new library/runtime features.** If a runtime genuinely cannot be
  supported by the current public API, document the limitation in that example's
  README and STOP for that one unit - do not patch `packages/*`.
- **Do not change the published packages' API or version.** Adapters consume the
  existing public surface only.
- **No deployment automation** (no "Deploy" buttons, Terraform, real cloud
  accounts). Examples are runnable locally / with the framework's standard dev
  command; cloud-specific ones include config files (e.g. `wrangler.toml`,
  `serverless`/`netlify.toml`) but are not actually deployed by CI.
- Frameworks deliberately excluded as too niche/legacy for this pass: Gatsby,
  Redwood, Waku, Qwik City, SolidStart, Tauri. (Can be added later via the
  recipe.)

## Instructions

Work in dependency order. **Unit 1 is a hard prerequisite for Units 2/3/4**
(they all import it). Unit 3 adapters are mutually independent and should be
fanned out one subagent per adapter once Unit 1 lands. Each adapter subagent
gets: this full PRD, `arch.md`, the path to the finished `packages/fixtures`
package and its `byId`/`documents` exports, and its assigned glue category (A-F)
snippet. There is **no shared `_TEMPLATE` skeleton** - every runtime's glue and
config genuinely differ, so each adapter is authored from its category snippet,
not copied from a skeleton.

### Unit 1 - Internal fixtures package `@imprint-pdf/fixtures` (PREREQUISITE)

Create `packages/fixtures/` per `arch.md` §3. It is a real `packages/*` package
(not under `examples/`), so it is built/typechecked/tested in CI normally - this
is deliberate, since `packages/bench` depends on it.

1. `package.json`: name `@imprint-pdf/fixtures`, `private: true`,
   `type: module`. Deps: `@imprint-pdf/react` and `@imprint-pdf/chart` as
   `workspace:*` (it is a sibling `packages/*` package consumed only inside the
   monorepo), `react` from `catalog:`. Dev: `typescript: catalog:`,
   `@types/react: catalog:`, `@types/node: catalog:`, `vitest: catalog:`.
   Scripts: `"typecheck": "tsc --noEmit"`, `"build": "tsc --noEmit"`,
   `"test": "vitest run"`.
   - It is consumed as TS/TSX source by `bench` (tsx) and the adapters' own
     compilers. If a specific adapter's bundler cannot resolve workspace TSX
     source, the fallback is a `tsup` build to `dist` - but **prefer source
     consumption** first; only switch if an adapter cannot resolve it. Note any
     switch in the unit result.
2. `tsconfig.json`: extend `tsconfig.base.json`, `jsx: react-jsx`,
   `noEmit: true`.
3. `src/types.ts`: the `DocEntry` interface exactly as in `arch.md` §3.
4. `src/index.ts`: `export const documents: DocEntry[]`,
   `export const byId = (id) => ...`.
5. `src/components/`: shared building blocks - migrate
   `examples/pdf-test/src/components/Table.tsx`; add small reusable
   `Barcode`/`QR` helpers (render via `<Svg>` or a data-URI `<Image>`; if a QR
   lib is needed use a tiny dependency-free generator or a static pre-encoded
   SVG string - keep it deterministic).
6. `src/<doc>/index.tsx` + `sample.ts` for each of the **15** documents in
   `arch.md` §3's table. Seed Invoice/Report from
   `examples/pdf-test/src/templates/*`,
   `examples/next-app/src/templates/invoice.tsx`, and
   `packages/bench/src/fixtures/{invoice,report}.tsx`; author the other
   documents fresh in the same Tailwind style. Each exports a `Component` and a
   deterministic `sample` props object (**no
   `Date.now()`/`Math.random()`/`crypto.randomUUID()`/argless `new Date()`** -
   enforced by a STOP condition and the checklist grep). Match the existing
   visual baseline: real-looking domain data, `font-sans`, sensible spacing, A4
   unless the use-case dictates otherwise (label = 4×6, receipt = narrow).
7. Confirm `src/**` (outside `*.test.ts`) imports **zero** `pdf` symbols
   (checklist grep).
8. **Render tests** (`src/render.test.ts`, vitest). Iterate `documents`, render
   each via `@imprint-pdf/react`'s `pdf(d.render(), { as: 'bytes' })`, and
   assert: bytes start with `%PDF-`, length is non-trivial (> 1 KB), and the
   rendered count equals `documents.length`. This is the actual render coverage
   the matrix exists to provide; the per-runtime adapters then prove the same
   documents _compile_ against each runtime.
   - The test file imports the **node** `pdf()` entry - fine, it lives in the
     test, not in the document components. Components stay `pdf`-free.

This unit is large; split it: one subagent owns the package scaffold +
`types.ts` + `index.ts` + `components/` + `render.test.ts`, then fan out
document authoring across a few subagents (group the 15 documents into batches),
each returning the files it added so the orchestrator wires them into
`src/index.ts`.

### Unit 2 - examples/README matrix

Authored after the Unit 3 adapters exist (so links resolve).

1. `examples/README.md`: the runtime × category matrix table from `arch.md` §5,
   each row linking to its folder, with columns for the glue category, a
   one-line "what's shown", and a **DX column** (glue LoC + 🟢/🟡/🔴 friction
   flag, per `arch.md` §8). Include the 15-document corpus table too. No shared
   skeleton folder - the "add a runtime" recipe (`arch.md` §9) authors each
   adapter from its category snippet.

### Unit 3 - The 26 runtime adapters (fan out, one subagent per adapter)

For **each** row in `arch.md` §5's table, create `examples/<dir>/` (migrate the
four existing ones in place rather than duplicating). Every adapter:

- `package.json`: name `@imprint-pdf/example-<runtime>`, `private`, the
  framework dep(s), `@imprint-pdf/fixtures: "workspace:*"`, the right
  `@imprint-pdf/*` libs at the existing examples' version specifier, and
  **`"typecheck": "tsc --noEmit"`** (or the framework-native equivalent:
  `svelte-check` for SvelteKit, `nuxi typecheck` for Nuxt, `astro check` for
  Astro).
- One handler/glue file using the **category snippet** for its row (A-F, see
  `arch.md` §4) and importing `byId`/`documents` from `@imprint-pdf/fixtures`.
  Edge/browser/Lambda rows (category D/E) **must** import from
  `@imprint-pdf/react/standalone`, not the node entry.
- `README.md`: one-line "what's demonstrated", the run command
  (`pnpm --filter @imprint-pdf/example-<runtime> dev` or the framework's), which
  glue category it is, and a short **`## DX notes`** section (glue LoC,
  friction, node-vs-standalone entry) per `arch.md` §8.
- `tsconfig.json` extending `tsconfig.base.json` (or the framework's required
  config).

Adapter list (full detail in `arch.md` §5): `next-app`(migrate), `next-pages`,
`next-server-action`, `remix`, `tanstack-start`, `sveltekit`, `nuxt`, `astro`,
`express`, `fastify`, `koa`, `nestjs`, `hono-node`, `trpc`, `graphql-yoga`,
`cloudflare-worker`(migrate), `vercel-edge`, `aws-lambda`, `netlify-functions`,
`deno-deploy`, `bun-elysia`, `bun-server`(migrate), `vite-spa`(migrate from
`vite-react`), `browser-standalone`, `electron`, `node-cli`(repurpose
`pdf-test`), `queue-worker`.

Notes per tricky adapter:

- `vite-spa`: migrate `vite-react` to import one document from
  `@imprint-pdf/fixtures` and render it in-browser via
  `@imprint-pdf/react/standalone` (download a Blob). **No gallery** - a
  single-document SPA proving the bundler+browser path.
- `node-cli`: repurpose `pdf-test` - iterate `documents`, render each to
  `./out/<id>.pdf`. Keep it as the de-facto local render-smoke (used in the
  checklist below).
- `trpc` / `graphql-yoga`: the procedure/resolver returns base64 (or a link);
  include a tiny fetch route that streams the bytes so it is actually runnable.
- `react18-tailwind3-nextjs`: leave as the React-18/Tailwind-v3 compatibility
  smoke; optionally repoint its document import at `@imprint-pdf/fixtures` if
  trivial, else leave untouched.

### Unit 4 - Benchmark integration (`packages/bench`)

Per `arch.md` §7. Depends on Unit 1.

1. Add `@imprint-pdf/fixtures: "workspace:*"` to `packages/bench/package.json`.
2. Replace `packages/bench/src/fixtures/{invoice,report}.tsx` with thin
   re-exports from `@imprint-pdf/fixtures` (or delete them and repoint the
   suites' import sites). **No behaviour change** to existing suites - the same
   invoice/report render with the same output.
3. Add a new suite `packages/bench/src/suites/documents.ts` (wired into
   `src/index.ts` as `--suite documents`) that renders the **whole corpus** and
   reports per-document timings, plus a `bench:documents` script in
   `package.json`.
4. Confirm `pnpm bench` (default) and `pnpm bench:documents` run without error
   and emit timings.

### Unit 5 - Docs wiring

1. `docs/README.md` Frameworks section: extend with the new runtimes (or link
   out to the examples matrix). Frame as "tested runtimes", not "starter
   templates".
2. New `docs/examples.md`: an internal index of the runtime matrix linking each
   `examples/<dir>/`, grouped by category, plus the document corpus list and the
   DX matrix. Link it from `docs/README.md`.
3. If `llms.txt` enumerates examples, update it; **do not** hand-edit
   `llms-full.txt` if it is generated (check for a generator script first - per
   global rule, never edit auto-generated files).

### Ordering

Unit 1 → (Unit 2 ∥ Unit 4 may start once Unit 1 lands) → Unit 3 fan-out (needs
Unit 1 exports + Unit 2 skeleton) → Unit 5 (needs final adapter dir list). Run
the AI checklist after each batch of adapters, not only at the end, so a broken
adapter is caught early.

## STOP conditions

- **A document component in
  `packages/fixtures/src/**`(outside`\*.test.ts`) imports `pdf()`\*\* (any of
  the three entries). The runtime-agnostic contract is broken; stop and fix
  before proceeding - adapters will fail to compile for the wrong runtime.
- **Non-deterministic sample data** appears (`Date.now`, `Math.random`,
  `crypto.randomUUID`, `new Date()` with no arg). Stop and replace with fixed
  values.
- **A runtime cannot be supported by the current public API** without changing
  `packages/*`. Document the gap in that example's README and STOP for that
  unit; do not patch the library (that is a non-goal).
- **Install or typecheck time explodes** beyond practicality (e.g. a single
  framework drags in a massive/unbuildable toolchain on CI's matrix). Stop and
  report; we may drop or defer that one runtime rather than block the batch.
- **The existing examples' version specifier for `@imprint-pdf/*` is not what
  this PRD assumed** (`1.0.0-alpha.4` at `1ec7185`). Re-read
  `examples/next-app/package.json`; if release wiring changed, stop and confirm
  the specifier to use.
- **Drift**: `git diff --stat` of `examples/` and `packages/react|next|chart`
  since `1ec7185` shows the API/exports moved. Re-verify the snippets in
  `arch.md` §4 against the current exports before generating adapters.
- **CI `build` filter changed** (someone un-excluded examples). Stop and
  reconcile - new un-buildable examples would break the build job.

## AI verification checklist (automatable)

Run from repo root.

- [ ] `pnpm install` - resolves; the new `@imprint-pdf/fixtures` and all
      `examples/*` packages link.
- [ ] **Documents are pdf-free**:
      `grep -rn "\bpdf\b" packages/fixtures/src --include=*.tsx --include=*.ts | grep -v '\.test\.' | grep -iE "import|from '@imprint-pdf"` -
      returns **no** import of the `pdf` function from `src/**` outside tests
      (component imports are fine).
- [ ] **Determinism**:
      `grep -rnE "Date\.now|Math\.random|crypto\.randomUUID|new Date\(\s*\)" packages/fixtures/src | grep -v '\.test\.'` -
      returns nothing.
- [ ] `pnpm typecheck` - **0 errors**, and the output shows every new
      `@imprint-pdf/example-*` package running its `typecheck` task (i.e. they
      are gated now, not skipped). Spot-check the turbo summary lists them.
- [ ] `pnpm test` - passes, including `@imprint-pdf/fixtures`' render tests
      (every document → valid `%PDF-` bytes, count == `documents.length`).
- [ ] `pnpm lint` (`biome check .`) - clean.
- [ ] `pnpm format:check` - clean (new Markdown/JSON Prettier-clean).
- [ ] **Bench wiring**: `pnpm bench` runs unchanged, and `pnpm bench:documents`
      renders the whole corpus and emits per-document timings.
      `packages/bench/src/fixtures/{invoice,report}.tsx` no longer define their
      own components (they re-export from `@imprint-pdf/fixtures`).
- [ ] **Render smoke (local, not CI)**:
      `pnpm --filter @imprint-pdf/example-node-cli <run script>` renders all 15
      documents to `./out/*.pdf` with non-zero byte sizes (each > 1 KB). Report
      the size table.
- [ ] `examples/README.md` matrix lists all 26 adapter rows and all 15
      documents, every link resolves to an existing dir/file.
- [ ] Each `examples/<dir>/package.json` declares a `typecheck` script (or
      framework equivalent):
      `for d in examples/*/; do test -f "$d/package.json" && grep -q '"typecheck"\|svelte-check\|nuxi typecheck\|astro check' "$d/package.json" || echo "MISSING gate: $d"; done` -
      prints nothing.
- [ ] No document body is duplicated across adapters:
      `grep -rl "function Invoice" examples --include=*.tsx` - returns nothing
      (the only Invoice definition lives in `packages/fixtures`).

## Human verification checklist (judgment calls)

- [ ] Open the rendered `out/*.pdf` (from the node-cli smoke): each use-case
      **looks like the real document** it claims to be - an invoice reads as an
      invoice, the certificate is centered and decorative, the form fields are
      actually fillable, the charts render as vectors. Be picky about
      layout/typography quality per the project's bar.
- [ ] Spot-run 3-4 adapters across different categories (e.g. `express`, `trpc`,
      `cloudflare-worker`, `vite-spa`) and confirm each actually serves/produces
      a valid PDF, not just typechecks.
- [ ] The **DX notes / DX matrix** ring true - the friction flags reflect real
      pain, and the 🔴 runtimes are worth follow-up library work.
- [ ] The runtime list is the right coverage set (no embarrassing omission; the
      excluded-frameworks list in Non-goals is acceptable).
- [ ] Each adapter's glue is genuinely idiomatic for that framework (a Fastify
      user would write it that way), not a forced copy of the Express snippet.
- [ ] Install/CI time increase from ~26 new packages + the fixtures package is
      acceptable for the repo's CI budget.
- [ ] Benchmark numbers from `pnpm bench:documents` look sane (no document is
      pathologically slow in a way that signals a real perf bug).
