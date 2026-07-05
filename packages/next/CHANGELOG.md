# Changelog

## 1.0.0-alpha.11

### Patch Changes

- Keep imprint's WASM dependencies out of the Next.js webpack server bundle so
  `next build` traces and boots cleanly under `output: 'standalone'`.

- Updated dependencies []:
  - @imprint-pdf/core@1.0.0-alpha.11
  - @imprint-pdf/react@1.0.0-alpha.11

All notable changes are documented here. See
[Conventional Commits](https://www.conventionalcommits.org) and
[Changesets](../../.changeset) for the release workflow.

## 1.0.0-alpha.3

### Minor

- **Unified `pdf()` entry point.** `pdf(element, options?)` is the single
  recommended way to render a PDF from a Next.js route. It returns a `Response`
  by default, auto-loads `imprint.config.ts`, and auto-detects edge vs Node
  runtime (via `NEXT_RUNTIME` / `globalThis.EdgeRuntime`) — dynamically
  dispatching to the right `@imprint-pdf/react` build. `renderToServer`,
  `renderToEdge`, and `createPdfResponse` remain as soft-deprecated aliases for
  one major and will be removed next.
- **`withImprint` Turbopack support.** The plugin adds `turbopack.resolveAlias`
  for `virtual:imprint-classes` → `@imprint-pdf/tailwind/runtime` so Tailwind's
  runtime fallback resolves under Next 16's default bundler. Before this fix,
  anyone on a recent Next.js app would silently render unstyled PDFs because the
  compile-time `ImprintWebpackPlugin` is webpack-only and Turbopack had no
  equivalent.
- **Peer ranges broadened**: `next` → `^14 || ^15 || ^16`, `react` →
  `>=18.2.0 <20`.
