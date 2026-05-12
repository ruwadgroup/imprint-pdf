# Changelog

## 1.0.0

### Minor Changes

- [`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584)
  Thanks [@tamimbinhakim](https://github.com/tamimbinhakim)! - `imprint init`
  now does the framework wiring.

  It reads the consumer's `package.json` to detect Next.js (App or Pages
  Router), Vite, or generic Node, then idempotently:
  - Writes `imprint.config.ts` (existing behaviour).
  - For Next.js: edits `next.config.{ts,mjs,js,cjs}` to wrap the existing
    `export default` with `withImprint({})`, or creates one if missing.
    Scaffolds `templates/ExamplePdf.tsx` and either `app/api/pdf/route.tsx` (App
    Router) or `pages/api/pdf.tsx` (Pages Router).
  - For Vite: inserts `imprint()` into the `plugins:` array of
    `vite.config.{ts,mts,js,mjs}`, scaffolds `src/templates/ExamplePdf.tsx` and
    a `src/pdf.ts` helper.
  - Prints a per-framework "next steps" line.

  Existing files are left untouched — re-running is safe.

### Patch Changes

- Updated dependencies
  [[`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584),
  [`52570c9`](https://github.com/tamimbinhakim/imprint-pdf/commit/52570c9d8b08ae68e1cb9d81a2fe7cebe3e37a5f),
  [`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584),
  [`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584)]:
  - @imprint-pdf/core@1.0.0
  - @imprint-pdf/react@1.0.0

All notable changes are documented here. See
[Conventional Commits](https://www.conventionalcommits.org) and
[Changesets](../../.changeset) for the release workflow.
