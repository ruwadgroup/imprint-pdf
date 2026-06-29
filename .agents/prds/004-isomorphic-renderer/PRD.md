---
id: 004
title:
  Isomorphic @imprint-pdf/react - one browser-safe entry + in-memory Tailwind
slug: 004-isomorphic-renderer
status: ready
tags: [area:packaging, area:core, area:dx, type:refactor, theme:browser-compat]
priority: P1
severity: high
effort: L
risk:
  Touches the core render/asset/font path and the Tailwind runner; a regression
  could change rendered output. The e2e golden/visual suite is the safety net
  and MUST stay green.
planned_at: { commit: 3e76373, date: 2026-06-29 }
depends_on: []
mockups:
  interface: null
  architecture: arch.md
research: research/
---

# PRD 004: Isomorphic @imprint-pdf/react - one browser-safe entry + in-memory Tailwind

> **Executor instructions**: This PRD is portable - everything you need is in
> this file and `arch.md`. Follow it top to bottom. This refactors the core
> render path, so the **Node e2e golden / visual suite is your safety net** -
> run it after every unit and never let it move. If a STOP condition fires, stop
> and report - do not improvise.

## Problem

`@imprint-pdf/react` cannot be consumed in the browser without hand-patching,
and the browser cannot use a project's real Tailwind theme. Both have **one root
cause**: the default entry reaches the filesystem at module load.

1. **Build breakage.** A bare `import { pdf } from '@imprint-pdf/react'` in any
   browser bundle (Vite/webpack/Rollup) fails - `dist/index.js` statically
   imports `fs`/`module`(`createRequire`)/`path`. Cause (traced, see `arch.md`):
   `packages/react/tsup.config.ts` has `noExternal: ['@imprint-pdf/tailwind']`,
   which inlines the Tailwind package's **disk loader** (`tw-runner.ts`, reads
   the project config/stylesheet from disk) into the main bundle; and
   `@imprint-pdf/core`'s default entry pulls node-only asset/font disk loaders.
   Real apps work around this with bundler aliases/externalization/pnpm patches
   (the maintainer's `nexaml` app did exactly this).
2. **No project Tailwind in the browser.** The browser path resolves classes off
   the **DOM** (`getComputedStyle`), so it only sees classes the page's CSS
   still contains - Tailwind purges the rest, so PDF-only classes silently don't
   resolve; and it needs `document` (breaks in workers). Passing
   `options.tailwind` to the standalone path currently **throws**.

The library already contains the browser-safe building blocks
(`@imprint-pdf/react/standalone`, `@imprint-pdf/core/browser`,
`@imprint-pdf/tailwind/runtime`) - but only as a _parallel_ build bolted on with
a second entry. The real fix is to make the **default** entry browser-safe by
construction (no static `node:*`; node disk work lazy + runtime-guarded) and to
route Tailwind through an **in-memory** compile path that serves Node and the
browser identically. Then the node/standalone split collapses.

## Mockups

- **Interface** - `null`. No UI; this is packaging + render-pipeline
  architecture.
- **Architecture** - `arch.md`: the traced root cause, the target module graph
  (lazy node-only seam), the unified Tailwind seam (compile vs disk-resolve),
  the entry consolidation, and the acceptance shape. **Read it first.**

## Context (self-contained)

### Verified facts (at commit `3e76373`)

- `packages/react/tsup.config.ts`: `entry { index, server, standalone }`,
  `noExternal: ['@imprint-pdf/tailwind']`. The `noExternal` is what bundles
  `tw-runner.ts`'s `fs`/`createRequire`/`path` into `dist/index.js` (11 node
  built-in uses there).
- `packages/tailwind/src/tw-runner.ts` statically imports
  `{ existsSync, readFileSync } from 'node:fs'`,
  `{ createRequire } from 'node:module'`, `path from 'node:path'`. It finds the
  v4 stylesheet / v3 config under `projectRoot` (or `options.stylesheet`), reads
  it, and runs Tailwind's `compile`. `packages/tailwind/src/runtime.ts`
  `resolveBrowserClassMap(classes)` is the DOM resolver (no fs).
  `@imprint-pdf/tailwind` has a `./runtime` subpath export. The package builds
  with `tsup` (`entry { index, vite, webpack, runtime }`).
- `packages/react/src/render.ts` already does
  `const { runTailwind } = await import('@imprint-pdf/tailwind')` (dynamic) - so
  the only reason its node imports are static in the bundle is the `noExternal`
  inlining.
- `packages/react/src/render-standalone.ts` throws when `options.tailwind` is
  set outside a DOM (the "only available in the Node entry" error). The
  standalone `pdf()`/`renderToBuffer`/`renderToStream` re-export the same
  components as the main entry; only node-only
  `renderForInspector`/`InspectorRenderResult` are absent.
- `packages/react/src/config-loader.ts` already lazy-loads `imprint.config.*`
  via dynamic `import('node:fs'|'node:path'|'node:url')` inside try/catch - the
  model to copy for the remaining node-only loaders.
- `packages/core/src/index.ts` statically re-exports `createAssetResolver`
  (`assets.ts`) and font loaders (`typography/fonts.ts`); these pull node disk
  reads (`fs/promises`) into core's default `dist/index.js`. `packages/core` has
  a browser entry already: `src/browser.ts` + `src/assets-browser.ts`, and tsup
  emits a `browser` entry. `@imprint-pdf/core/browser` is a real subpath export.
- `RenderOptions.tailwind` (`packages/core/src/types.ts` ~415-427) already has
  `stylesheet?: string`, `config?`, `projectRoot?`, `runtimeFallback?`,
  `safelist?`, `classMap?` - the hooks the in-memory path reuses.
- The shared layout/draw engine (`taffy-wasm`, `packages/core/src/writer/*`) is
  already runtime-agnostic (the standalone build renders real PDFs in browsers -
  see `examples/vite-spa`). So the base pipeline does **not** need rewriting;
  only the disk-reaching edges do.

### Repo gates (from `.github/workflows/ci.yml` + `package.json`)

- `pnpm build` (turbo; excludes `@imprint-pdf/example-*`), `pnpm typecheck`,
  `pnpm lint` (biome), `pnpm test:ci` (turbo `test`), plus `pnpm test:visual`
  and `pnpm test:goldens:update` for the e2e golden/visual suite
  (`packages/e2e`).
- Build per package is `tsup`. WASM crates build via `wasm-pack`
  (`pnpm wasm:build`).

### Why this is one PRD, not two

The build breakage and the browser-Tailwind gap are the **same seam** (disk
access in the default entry). Fixing the entry to be node-free forces the
Tailwind path to become in-memory, which is exactly what unlocks project-config
Tailwind in the browser. Splitting them would mean doing the seam twice.

## Non-goals

- **Do not change the public component API or the `pdf()` signature.** Only
  _add_ in-memory Tailwind support (`options.tailwind.stylesheet`/`config`
  honored in the browser) and make the entry isomorphic. Node call sites keep
  working unchanged.
- **Do not regress Node behaviour or output.** The Node path still auto-loads
  config/stylesheet/fonts from disk (now lazily). Every existing e2e golden and
  visual snapshot must be byte-identical. **Updating goldens to make tests pass
  is forbidden** unless a change is independently confirmed correct and signed
  off.
- **Fully remove the now-redundant entries (no deprecated aliases).** The
  library is pre-1.0 alpha, so breaking changes are fine. Delete
  `@imprint-pdf/react/standalone`, `@imprint-pdf/core/browser`, their source
  files, tsup entries, and `exports` subpaths entirely, and repoint **every**
  consumer to the bare `@imprint-pdf/react` / `@imprint-pdf/core`.
- **Do not rewrite the layout/draw engine** (taffy/writer) - it is already
  isomorphic.
- **Do not ship a build-time Tailwind class-map plugin** in this PRD (a possible
  future optimization). The runtime in-memory compile is the deliverable.
- **Do not add native Node addons** or change font subsetting algorithms; just
  make their _loading_ lazy.

## Instructions

Ordered; each unit ends by running the safety-net checks. Units 1-2 are the core
seam (sequential); 3-4 build on them; 5-6 are packaging/docs.

### Unit 0 - Feasibility spike (do FIRST, time-boxed)

Prove Tailwind v4's `compile()` runs in a browser-like context (no `fs`) given
an in-memory stylesheet. In a scratch test, call the installed `tailwindcss`
`compile(css, { loadStylesheet, loadModule })` with
`css = '@import "tailwindcss"; @theme { --color-brand: #4f46e5; }'` and
`loadStylesheet` returning the bundled preset text for `tailwindcss`, then
generate CSS for a class that uses the custom theme (e.g. `text-brand`) and
assert it resolves. Use only in-memory strings - no disk reads.

- **If it works** - proceed; this is the engine for Unit 2.
- **If Tailwind v4 cannot resolve `@import "tailwindcss"` purely in-memory** -
  STOP and report; fall back plan is to ship the in-memory compile fed by a
  _fully pre-bundled_ stylesheet (the user passes already-flattened CSS) and
  note the limitation. Do not silently change the approach.

### Unit 1 - Make the default entries browser-clean (no static `node:*`)

1. **`@imprint-pdf/tailwind`**: separate the node disk-resolve from the pure
   compile. Keep `tw-runner.ts`'s `fs`/`createRequire`/`path` in a **node-only**
   module (e.g. `src/node-resolve.ts`) that is only ever reached via dynamic
   import behind a runtime guard. Export an isomorphic `compile(classes, css)`
   (no node imports) usable by the browser path (Unit 2). The package's main
   entry must not statically import `node:*`.
2. **`packages/react/tsup.config.ts`**: remove
   `noExternal: ['@imprint-pdf/tailwind']` (keep tailwind external) so the
   dynamic `import('@imprint-pdf/tailwind')` in `render.ts` stays a real lazy
   boundary and its node-only `node-resolve` chunk never enters the main bundle.
   If dropping `noExternal` breaks Node resolution of tailwind at runtime (it is
   a workspace/published dep), confirm the consumer install still resolves it;
   otherwise keep it external + lazy-only.
3. **`@imprint-pdf/core`**: ensure the default entry's static graph has no
   `node:*`. Move the node-only asset/font **disk** readers behind lazy dynamic
   imports (model: `config-loader.ts`), defaulting to the browser-safe asset
   path (`assets-browser.ts`) and lazily upgrading to disk reads on Node.
   `core/browser` stays as an alias.
4. Rebuild and assert: `packages/react/dist/index.js` and
   `packages/core/dist/index.js` contain **no** static
   `from 'fs'|'module'|'path'| 'fs/promises'|'node:*'` at module scope
   (checklist grep / regression test).

### Unit 2 - Unified in-memory Tailwind compile

1. In the render pipeline, resolve the Tailwind class map through one path used
   by both runtimes (see `arch.md` "Tailwind seam"):
   `stylesheet = options.tailwind?.stylesheet ?? (node ? await lazyDiskResolve(options) : undefined)`,
   then
   `classMap = stylesheet ? await compile(classes, stylesheet) : await domOrDefault(classes, options)`.
2. Remove the `render-standalone.ts` throw ("only available in the Node entry").
   When `options.tailwind.stylesheet`/`config` is provided in a non-DOM browser
   context, compile in-memory (Unit 0 engine). Keep the DOM resolver
   (`resolveBrowserClassMap`) as the zero-config fallback and `classMap` as the
   prebuilt escape hatch.
3. Node: keep auto-loading the project stylesheet/config from disk when the
   caller passes none - now via the lazy `node-resolve` module. Output must be
   identical to today (goldens).

### Unit 3 - Consolidate into one isomorphic entry

1. Merge the standalone render path into the default so `@imprint-pdf/react`'s
   `pdf()` / `renderToBuffer` / `renderToStream` work in Node and the browser
   from the same import, detecting the runtime and lazily enabling node
   conveniences.
2. **Fully delete** `@imprint-pdf/react/standalone` and
   `@imprint-pdf/core/browser`: remove their source (`src/standalone.ts`,
   `src/render-standalone.ts`, `src/render-browser-pipeline.ts` if now subsumed;
   `core/src/browser.ts`), their tsup `entry` keys, and their `exports`
   subpaths. Then repoint **every** consumer to the bare entry. Known importers
   of `@imprint-pdf/react/standalone` to fix (grep to confirm the full set):
   `@imprint-pdf/fixtures` and examples `cloudflare-worker`, `bun-server`,
   `bun-elysia`, `vercel-edge`, `aws-lambda`, `netlify-functions`,
   `deno-deploy`, `vite-spa`, `browser-standalone`. No deprecated alias is left
   behind.
3. No `"browser"` export condition is added - one isomorphic build serves all
   bundlers.

### Unit 4 - Tests (lock both halves of the fix)

1. **Browser-clean regression test** (`packages/react`, vitest): read the built
   `dist/index.js`, assert no module-scope `node:*`/`fs`/`module`/`path` import.
2. **Isomorphic-parity test**: render a document that uses a **custom** Tailwind
   theme token (e.g. a `text-brand` class defined via `@theme`) two ways - (a)
   Node with the stylesheet auto-loaded/passed, (b) a browser-like context (mock
   away `document`) with the same stylesheet passed as
   `options.tailwind.stylesheet` - and assert the two PDFs are byte-identical
   (or equal under the e2e text/geometry helpers).
3. **Browser build test**: `examples/vite-spa` (and `browser-standalone`) import
   the **bare** `@imprint-pdf/react` and pass their stylesheet; `vite build`
   succeeds. (Revert the PRD-002 workaround where fixtures import
   `/standalone` - they can use the bare entry now.)

### Unit 5 - Examples + docs

1. Update `examples/vite-spa` / `examples/browser-standalone` to the bare
   import + in-memory stylesheet, demonstrating project-Tailwind-in-the-browser.
2. `@imprint-pdf/fixtures`: components may revert to importing from
   `@imprint-pdf/react` (bare) now that it is browser-safe.
3. Docs: `docs/frameworks/vite.md`, `docs/guides/tailwind.md`, and any
   `/standalone` guidance - document that `@imprint-pdf/react` is isomorphic,
   that browser consumers pass `tailwind: { stylesheet }` to use their theme,
   and that `/standalone` is a deprecated alias.

## STOP conditions

- Unit 0 spike fails (Tailwind v4 cannot compile in-memory) - STOP and report;
  do not silently fall back.
- Any existing **e2e golden / visual snapshot changes** - STOP; the Node render
  path drifted. Do not update goldens to go green.
- Removing `noExternal` breaks Node runtime resolution of
  `@imprint-pdf/tailwind` for a real consumer - STOP and reconsider the
  lazy-chunk approach.
- A `node:*` import cannot be made lazy without a deep rewrite of the
  layout/draw engine - STOP and report (it should not be needed; the engine is
  already isomorphic).
- The unified entry changes the `pdf()` public signature or a component's
  props - STOP; that is a non-goal.

## AI verification checklist (automatable)

- [ ] `pnpm build` - succeeds for all packages.
- [ ] **No node built-ins in the browser entry**:
      `grep -nE "from '(node:)?(fs|module|path|url|fs/promises)'" packages/react/dist/index.js packages/core/dist/index.js`
      returns nothing (and the Unit 4 regression test enforces it).
- [ ] `pnpm typecheck` - 0 errors.
- [ ] `pnpm lint` - clean.
- [ ] `pnpm test` - passes, including the new browser-clean + isomorphic-parity
      tests.
- [ ] **Goldens unchanged**: `pnpm test:visual` passes with **no** snapshot
      updates; `git status` shows no modified files under `packages/e2e`
      goldens/ `__pixmaps__`.
- [ ] **Browser build, bare import**: in `examples/vite-spa`,
      `pnpm exec vite build` succeeds with the app importing
      `@imprint-pdf/react` (not `/standalone`).
- [ ] **Node unaffected**: `pnpm --filter @imprint-pdf/e2e test` and
      `pnpm --filter @imprint-pdf/fixtures test` pass.
- [ ] **Project Tailwind in browser**: the isomorphic-parity test proves a
      custom `@theme` class resolves in a no-`document` context via
      `tailwind: { stylesheet }`.

## Human verification checklist (judgment calls)

- [ ] In the maintainer's `nexaml` app, remove the manual patches/aliases,
      import `@imprint-pdf/react` directly, pass the app's Tailwind stylesheet,
      and confirm a client-side PDF renders with the **correct project theme**
      (custom colors, tokens, fonts).
- [ ] Rendered output (a few real documents) is visually identical Node vs
      browser.
- [ ] No SSR/Next.js regression: server route handlers / RSC still render (Node
      path), `examples/next-app` still works.
- [ ] Browser bundle size / cold start with the in-memory Tailwind compiler is
      acceptable; the compiler is only pulled when `tailwind.stylesheet` is
      used.
- [ ] Docs read correctly: the bare import "just works" everywhere;
      `/standalone` reads as deprecated-but-supported.
