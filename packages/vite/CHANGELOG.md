# Changelog

## 1.0.0

### Patch Changes

- [`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584)
  Thanks [@tamimbinhakim](https://github.com/tamimbinhakim)! - Zero-install
  React 18 + Tailwind v3 support.

  **React 18.** `@imprint-pdf/react` now bundles both `react-reconciler@^0.29`
  (R18) and `^0.33` (R19) under aliased package names and picks the matching one
  at module load via `React.version`. Consumers install neither directly — a
  single `pnpm add @imprint-pdf/react react@^18` (or `react@^19`) works.

  The host-config is built dynamically: the 16 R19-only fields
  (transition/priority/suspense/form/paint hooks) are only included on R19;
  `commitUpdate` reads `newProps` from the last arg either way (5-arg on R18,
  4-arg on R19); `createContainer` and `updateContainerSync`/`flushSyncWork` are
  shimmed by arity / feature-detection.

  **Tailwind v3.** `@imprint-pdf/tailwind`'s runner now detects the consumer's
  installed `tailwindcss` major and dispatches: v3 → classic PostCSS plugin
  against a `@tailwind base/components/utilities` stub with the full class set
  as `safelist`; v4 → unchanged `tw.compile()` path.

  Precedence ladder:
  1. `options.config` → v3
  2. `options.stylesheet` → v4
  3. Auto-detected `tailwind.config.{ts,js,mjs,cjs}` + installed v3 → v3
  4. Otherwise → v4

  `tailwindcss` peer broadens to `^3.4.0 || ^4.0.0`; `postcss` is now an
  optional peer (only required on v3). `react` peer broadens to `>=18.2.0 <20`.
  `next` peer broadens to `^14.0.0 || ^15.0.0 || ^16.0.0`. `vite` peer broadens
  to `^5.0.0 || ^6.0.0 || ^7.0.0`.

- Updated dependencies
  [[`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584),
  [`52570c9`](https://github.com/tamimbinhakim/imprint-pdf/commit/52570c9d8b08ae68e1cb9d81a2fe7cebe3e37a5f),
  [`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584)]:
  - @imprint-pdf/core@1.0.0
  - @imprint-pdf/tailwind@1.0.0

All notable changes are documented here. See
[Conventional Commits](https://www.conventionalcommits.org) and
[Changesets](../../.changeset) for the release workflow.
