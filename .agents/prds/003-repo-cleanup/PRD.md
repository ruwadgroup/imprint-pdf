---
id: 003
title:
  Repo cleanup - drop chart dup, finish svg-rasterize, fix metadata, dedup
  utils, trim docs
slug: 003-repo-cleanup
status: done
tags: [area:packages, area:docs, type:refactor, theme:ts-only-cleanup]
priority: P2
severity: medium
effort: M
risk:
  Deleting/publishing packages can break the build graph or release config; util
  extraction can change behavior if a "duplicate" wasn't actually identical.
planned_at: { commit: 1ec7185, date: 2026-06-29 }
depends_on: []
mockups:
  interface: null
  architecture: null
research: null
---

# PRD 003: Repo cleanup - drop chart dup, finish svg-rasterize, fix metadata, dedup utils, trim docs

> **Executor instructions**: This PRD is portable - everything you need is in
> this file. Follow it top to bottom. The work splits into **6 independent
> units** (A-F) that touch disjoint files; they may be fanned out to one agent
> each. Run every command in the AI verification checklist and confirm the
> expected result before reporting done. If a STOP condition fires, stop and
> report - do not improvise.

## Problem

`imprint-pdf` is a TypeScript PDF monorepo (`@imprint-pdf/*`, pnpm + turbo +
biome, 19 packages). An audit found concrete, low-risk cleanup that reduces
package count and maintenance burden and finishes one half-built feature:

1. **`@imprint-pdf/chart` is a dead duplicate.** The chart feature ships from
   `@imprint-pdf/react` (`<Chart>` -> native `imprint-chart` node -> vector
   pipeline), which is what the docs reference. The standalone `chart` package
   is an older, `private`/unpublished, zero-consumer reimplementation
   (SSR-to-SVG-string). It should be deleted.
2. **`@imprint-pdf/svg-rasterize` is a real feature that is only half wired
   up.** core ships the slot (`pdf(doc, { svgRasterizer })` ->
   `setSvgRasterizer` -> `drawNode` rasterizes SVGs with `<filter>`/soft
   `<mask>`/`<foreignObject>`), but the resvg-WASM implementation package is
   `private`/unpublished, so users have nothing installable to pass into the
   slot. It should be **published and documented** (NOT merged into core - core
   deliberately carries no resvg dep).
3. **Stale package metadata.** Six packages are `private: true` yet still carry
   a `publishConfig` block (a contradiction). `CITATION.cff` declares a
   `BUSL-1.1` license that contradicts the Apache-2.0-only reality everywhere
   else. `.github/RELEASING.md`'s "ships to npm" list omits
   `@imprint-pdf/fonts`.
4. **Seven verbatim-duplicated internal utilities** across `sign`, `tailwind`,
   `react`, and `core`.
5. **Minor doc duplication**: the competitor comparison table is maintained
   twice (README + `docs/overview.md`), and one example's README is unrelated
   Next.js boilerplate.

None of this changes the public behavior of the shipping packages, except that
`svg-rasterize` becomes installable (new capability, additive).

## Mockups

- **Interface** - `null`. No user-facing application UI; this is package/repo
  structure and docs.
- **Architecture** - `null`. No new module seams; the before/after package list
  is small enough to state inline (see Unit A / Unit B).

## Context (self-contained)

All evidence below was verified at commit `1ec7185`.

### Package classification today (from each `packages/*/package.json`)

- **Published (not `private`)**: `core`, `react`, `next`, `cli`, `eslint`,
  `print`, `sign`, `ua`, `vite`, `fonts` (10).
- **`private: true`**: `bench`, `e2e`, `chart`, `svg-rasterize`, `icu-wasm`,
  `taffy-wasm`, `tailwind`, `testing` (8).
- **`private: true` AND still has a `publishConfig` block (contradiction)**:
  `chart`, `svg-rasterize`, `icu-wasm`, `taffy-wasm`, `tailwind`, `testing` (6).

### Chart: why `@imprint-pdf/chart` is a dead duplicate

- The shipping component is `packages/react/src/components/Chart.tsx`, exported
  from `packages/react/src/index.ts:5-6` and
  `packages/react/src/standalone.ts:9-10`. It emits
  `React.createElement('imprint-chart', ...)`; the reconciler maps that tag to a
  `chart` node at `packages/react/src/reconciler.ts:137`
  (`'imprint-chart': 'chart'`). Docs reference exactly this:
  `docs/guides/charts.md:13` and `docs/integrations/recharts.md:18` both
  `import { Chart } from '@imprint-pdf/react'`.
- `packages/chart/src/index.tsx` is a separate `Chart` (SSRs children to an SVG
  string and wraps in `<Svg>`) plus helpers `renderToSvgString`,
  `renderObservablePlot`, `renderECharts`. The package is `private: true`,
  `version: 1.0.0-alpha.3`, depends only on `@imprint-pdf/react`.
- **Nothing imports `@imprint-pdf/chart`**: a repo-wide grep for
  `@imprint-pdf/chart` (excluding `node_modules`/`dist`/lockfile/the package
  itself) hits only `CHANGELOG.md`, `ROADMAP.md`, and `.github/RELEASING.md` -
  no code, no examples, no other package.json. The 3 non-React helpers are
  **dropped** (decision: not salvaged - undocumented and unused; the
  d3/Observable docs already show passing `chart.outerHTML` straight to
  `<Svg>`).

### svg-rasterize: the slot is wired, the impl is unpublished

- core public API exports `setSvgRasterizer` / `getSvgRasterizer` /
  `clearSvgRasterizer` (`packages/core/src/index.ts:88-92`,
  `packages/core/src/browser.ts:86-90`) backed by
  `packages/core/src/writer/svg/rasterize-slot.ts`.
- `packages/react/src/render-pipeline.ts:83` and `render-browser-pipeline.ts:81`
  do `if (options.svgRasterizer) setSvgRasterizer(options.svgRasterizer)`.
  `pdf()` accepts `svgRasterizer` (type `SvgRasterizer` at
  `packages/core/src/types.ts:437,485`).
- `packages/core/src/writer/drawNode.ts:378-379` calls `getSvgRasterizer()` and
  uses it when `needsRasterization(src)`
  (`packages/core/src/writer/svg/rasterize-slot.ts:20`).
- `packages/svg-rasterize/src/index.ts` exports
  `rasterize(svg, {width,height,wasm})` and `initRasterizer(wasm)` over
  `@resvg/resvg-wasm`. It is `private: true`, so end-users cannot install it.
  **core has no resvg dependency** (confirmed: no `resvg` in
  `packages/core/package.json` or `packages/react/package.json`) and must keep
  it that way (lean core; heavy deps are opt-in add-ons).

### Metadata facts

- `CITATION.cff:28-30`:
  ```yaml
  license:
    - Apache-2.0
    - BUSL-1.1
  ```
  `LICENSING.md` states every package is Apache-2.0; there is zero other
  `BUSL-1.1`/"Business Source" mention in the repo. The `BUSL-1.1` line is a
  stale copy-paste error.
- `.github/RELEASING.md:10-22` declares "The 9 packages that ship to npm" and
  lists `core, react, next, eslint, print, cli, sign, ua, vite` - **missing
  `@imprint-pdf/fonts`**, which is published (not private). The "never
  published" block lists
  `bench, chart, e2e, icu-wasm, svg-rasterize, taffy-wasm, tailwind, testing`.

### Duplicated utilities (verbatim copies; all private/internal)

1. `toHex(bytes)` + `latin1ToBytes(s)` -
   `packages/sign/src/byterange.ts:278,284` and
   `packages/sign/src/encrypt.ts:310,316`.
2. `extractClasses(code)` - `packages/tailwind/src/vite.ts:14` and
   `packages/tailwind/src/webpack.ts:15` (they already reference shared regexes;
   verify where those constants live before extracting).
3. `normalizeClassMap(input)` - `packages/react/src/render-pipeline.ts:39` and
   `packages/react/src/render-browser-pipeline.ts:39`.
4. `ttfFallbackUrl(src)` - `packages/core/src/typography/fonts.ts:88` and
   `packages/core/src/typography/fonts-browser.ts:17` (a `font-common.ts` module
   already exists in that dir).
5. `decodeDataUri(src)` - `packages/core/src/assets.ts:17` and
   `packages/core/src/assets-browser.ts:10`.
6. `collectBookmarks(node, result)` - `packages/core/src/writer/outline.ts:5`
   and `packages/core/src/writer/shared.ts:54`.

### Doc duplication

- Competitor comparison table maintained twice: `README.md` (~lines 163-180, the
  fuller 7-row table) and `docs/overview.md` (~lines 77-93, a 5-row subset).
- `examples/react18-tailwind3-nextjs/README.md` is generic create-next-app
  boilerplate, not imprint-specific (the example itself - a React 18 + Tailwind
  3
  - Next 14 smoke test - is real and works).

### Verification commands this repo uses

- Install: `pnpm install` (CI uses `--frozen-lockfile`; deleting a package
  changes the lockfile, so run plain `pnpm install` locally and commit the
  updated `pnpm-lock.yaml`).
- Build: `pnpm build` (turbo). CI excludes examples:
  `pnpm exec turbo run build --filter='!@imprint-pdf/example-*'`.
- Typecheck: `pnpm typecheck`. Lint: `pnpm lint` (`biome check .`).
- Test: `pnpm test` / `pnpm test:ci` (turbo -> vitest).
- Markdown format gate: `pnpm format:check` (Prettier).

## Non-goals

- **No Python work** - that is PRD `001-remove-python`. Do not touch
  `docs/python/` or the ROADMAP/docs Python sections here.
- **Do NOT modify `CHANGELOG.md`.** It is a historical record (and per repo
  policy auto-generated changelogs / changelog files are not hand-edited).
  Leaving historical references to the removed `chart` package in it is correct.
- **Do NOT merge `svg-rasterize` into `core`** (would pull resvg into lean
  core).
- Do not delete `svg-rasterize`, `tailwind`, `icu-wasm`, `taffy-wasm`,
  `testing`, `bench`, or `e2e` - they are used or intentionally private.
- Do not change `@imprint-pdf/tailwind`'s `noExternal` inlining
  (`.github/RELEASING.md:24-27` warns against it).
- Do not configure npm Trusted Publisher rows (human/ops action; flagged in the
  human checklist).
- No broad doc rewrite - only the two specific doc dedups in Unit F.

## Instructions

Units A-F are independent (disjoint files) and may run concurrently. Within a
unit, follow the order given.

### Unit A - Delete `@imprint-pdf/chart`

1. Confirm no importers:
   `grep -rn "@imprint-pdf/chart" --include='*.ts' --include='*.tsx' --include='*.json' . | grep -vE 'node_modules|/dist/|pnpm-lock|packages/chart/|CHANGELOG.md|ROADMAP.md|RELEASING.md'`
   returns nothing. If it returns anything, STOP.
2. `git rm -r packages/chart`.
3. Remove `@imprint-pdf/chart` from `.github/RELEASING.md`'s "never published"
   block (Unit C also edits this file - if fanned out, coordinate; otherwise do
   the RELEASING.md edits together).
4. In `ROADMAP.md` (~lines 67-68) the bullet
   `` - [x] `@imprint-pdf/chart` adapter — SSR Recharts / Visx / Observable Plot / ECharts to SVG, embed via `<Svg>` ``
   describes a feature that **still exists** (in `@imprint-pdf/react`).
   **Reword, don't delete**, to reflect the real home, e.g.:
   ``- [x] `<Chart>` (`@imprint-pdf/react`) — SSR Recharts / Visx / Observable Plot / ECharts SVG output into the vector pipeline``.
5. Remove any reference to `packages/chart` from root `tsconfig.json` project
   `references` if present (grep it; it may not be listed).
6. Run `pnpm install` to refresh `pnpm-lock.yaml`.

### Unit B - Publish + document `@imprint-pdf/svg-rasterize`

1. In `packages/svg-rasterize/package.json`, change `"private": true` to remove
   the private flag (delete the line, or set `false`). Keep its existing
   `publishConfig` block (`access: public`, `provenance: true`).
2. In `.github/RELEASING.md`: move `@imprint-pdf/svg-rasterize` from the "never
   published" block into the publishable list, and update the count prose ("9
   packages" -> the new correct number; see Unit C, which also fixes the missing
   `fonts` entry - do the RELEASING.md edits in one pass).
3. Document the wiring. In `docs/guides/charts.md` (title "Charts and SVG",
   which already has a `<Svg>` section), add a short "SVG rasterization
   fallback" section covering:
   - Which SVG features need it: `<filter>`, soft `<mask>`, `<foreignObject>`
     (everything else renders as vectors).
   - Install: `pnpm add @imprint-pdf/svg-rasterize`.
   - Wire it via the `pdf()` option:
     ```ts
     import { pdf } from '@imprint-pdf/react';
     import { rasterize } from '@imprint-pdf/svg-rasterize';
     await pdf(<Doc />, { svgRasterizer: rasterize });
     ```
     (and mention the lower-level `setSvgRasterizer(rasterize)` from
     `@imprint-pdf/core` for non-React entry points, plus `initRasterizer(wasm)`
     for passing a custom `.wasm` source on edge runtimes). Keep wording
     consistent with the existing docs voice; one full sentence per line in the
     Markdown.
4. Do not add resvg to core or react. Do not change the slot code (it already
   works).

### Unit C - Fix package metadata

1. Remove the stale `publishConfig` block from the four packages that **stay
   private**: `packages/icu-wasm/package.json`,
   `packages/taffy-wasm/package.json`, `packages/tailwind/package.json`,
   `packages/testing/package.json`. (Do NOT touch `chart` - deleted in Unit A;
   do NOT touch `svg-rasterize` - becomes public in Unit B and keeps its
   `publishConfig`.)
2. `CITATION.cff:30` - delete the `  - BUSL-1.1` line so `license:` lists only
   `- Apache-2.0`.
3. `.github/RELEASING.md` - add `@imprint-pdf/fonts` to the publishable list and
   make the count prose correct after Unit A (remove chart) and Unit B
   (svg-rasterize now publishable). Final publishable set:
   `core, react, next, eslint, print, cli, sign, ua, vite, fonts, svg-rasterize`;
   final private set: `bench, e2e, icu-wasm, taffy-wasm, tailwind, testing`.
   (RELEASING.md is edited by A, B, and C - if these units are fanned out,
   assign ALL `.github/RELEASING.md` edits to a single agent to avoid
   conflicts.)

### Unit D - Dedup utilities in `sign`, `tailwind`, `react`

For each: before extracting, diff the two copies to confirm they are
byte-identical behavior. If they differ in any way, STOP and report (do not
silently merge).

1. **sign**: create `packages/sign/src/bytes.ts` exporting `toHex` and
   `latin1ToBytes`; import them in `byterange.ts` and `encrypt.ts`; delete the
   inline copies.
2. **tailwind**: create `packages/tailwind/src/extract.ts` exporting
   `extractClasses` (and the regex constants it needs, if those are also
   duplicated); import in `vite.ts` and `webpack.ts`; delete the inline copies.
3. **react**: create `packages/react/src/class-map.ts` exporting
   `normalizeClassMap`; import in `render-pipeline.ts` and
   `render-browser-pipeline.ts`; delete the inline copies.

### Unit E - Dedup utilities in `core`

Same "confirm identical first, else STOP" rule.

1. `ttfFallbackUrl` -> move into the existing
   `packages/core/src/typography/font-common.ts`; import in `fonts.ts` and
   `fonts-browser.ts`; delete inline copies.
2. `decodeDataUri` -> extract to a shared module (e.g.
   `packages/core/src/data-uri.ts`); import in `assets.ts` and
   `assets-browser.ts`; delete inline copies.
3. `collectBookmarks` -> extract to `packages/core/src/writer/bookmarks.ts` (or
   fold into one of the two and import); import in `outline.ts` and `shared.ts`;
   delete inline copies.

### Unit F - Doc dedup (lower priority)

1. Replace the competitor comparison table in `docs/overview.md` (~lines 77-93)
   with a one-to-two-sentence summary plus a link to the canonical table in
   `README.md` (keep README's fuller table as source of truth). Verify the link
   resolves.
2. Rewrite `examples/react18-tailwind3-nextjs/README.md` to describe what the
   example actually is (a React 18 + Tailwind v3 + Next 14 compatibility smoke
   test of imprint-pdf), replacing the create-next-app boilerplate. Keep it
   short.

## STOP conditions

- Unit A: any code/example/package.json (outside chart itself,
  CHANGELOG/ROADMAP/RELEASING) imports `@imprint-pdf/chart` - stop and report.
- Units D/E: the two "duplicate" copies are not behavior-identical - stop and
  report rather than merging.
- A cited `file:line` no longer matches the quoted symbol (code drifted since
  `1ec7185`) - re-locate by name; if ambiguous, stop and report.
- `pnpm install` / build reveals a workspace edge into `chart` you did not find
  in step A.1 - stop and report.
- You would need to edit `CHANGELOG.md` to make something pass - stop; that file
  is off-limits, re-think the approach.
- Removing `svg-rasterize`'s private flag surfaces a release/CI requirement
  beyond the package.json + RELEASING.md edits (e.g. a publish matrix that must
  be edited) - report it (do not invent npm Trusted Publisher config).

## AI verification checklist (automatable)

- [ ] `@imprint-pdf/chart` fully gone: `test ! -e packages/chart && echo OK`,
      and
      `grep -rn "@imprint-pdf/chart" --include='*.ts' --include='*.tsx' --include='*.json' . | grep -vE 'node_modules|/dist/|pnpm-lock|CHANGELOG.md'`
      returns nothing (CHANGELOG references are allowed and untouched).
- [ ] `packages/svg-rasterize/package.json` no longer has `"private": true`.
- [ ] No `private: true` package still carries `publishConfig`: for each of
      `icu-wasm, taffy-wasm, tailwind, testing` confirm `publishConfig` is
      absent; for `bench, e2e` confirm still private (they never had it).
- [ ] `grep -n 'BUSL' CITATION.cff` returns nothing; `license:` lists only
      Apache-2.0.
- [ ] `.github/RELEASING.md` lists `@imprint-pdf/fonts` and
      `@imprint-pdf/svg-rasterize` as publishable, no longer lists
      `@imprint-pdf/chart` anywhere, and the count prose matches the list.
- [ ] No duplicate util definitions remain: each of `toHex`, `latin1ToBytes`,
      `extractClasses`, `normalizeClassMap`, `ttfFallbackUrl`, `decodeDataUri`,
      `collectBookmarks` is defined exactly once
      (`grep -rn 'function <name>' packages/*/src`).
- [ ] `pnpm install` - succeeds; `pnpm-lock.yaml` updated and committed.
- [ ] `pnpm build` (`turbo run build --filter='!@imprint-pdf/example-*'`) -
      succeeds.
- [ ] `pnpm typecheck` - 0 errors.
- [ ] `pnpm lint` - clean.
- [ ] `pnpm test` - all pass (especially `packages/sign`, `packages/core`,
      `packages/react`, `packages/tailwind` whose utils moved).
- [ ] `pnpm format:check` - clean (edited Markdown is Prettier-clean).
- [ ] `docs/overview.md` link to the README comparison table resolves; no
      dangling links introduced.

## Human verification checklist (judgment calls)

- [ ] Confirm dropping `@imprint-pdf/chart` is intended (the `<Chart>` feature
      stays via `@imprint-pdf/react`; only the redundant package goes).
- [ ] The new `svg-rasterize` docs section reads correctly and the wiring
      snippet is accurate for both the `pdf()` option and `setSvgRasterizer`
      paths.
- [ ] Before the next release, add an npm **Trusted Publisher** row for
      `@imprint-pdf/svg-rasterize` (and confirm `@imprint-pdf/fonts` has one) -
      per `.github/RELEASING.md`, publishing without it returns `E404`. (Ops
      action; not done by the executor.)
- [ ] The reworded ROADMAP chart bullet still reads truthfully.
- [ ] The trimmed `docs/overview.md` still gives newcomers enough at-a-glance
      comparison, or the link is prominent enough.
- [ ] `examples/react18-tailwind3-nextjs/README.md` now accurately describes the
      example.
