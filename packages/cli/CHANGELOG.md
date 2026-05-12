# Changelog

All notable changes are documented here. See [Conventional Commits](https://www.conventionalcommits.org) and [Changesets](../../.changeset) for the release workflow.

## 1.0.0-alpha.3

### Minor

- **`imprint init` now does the framework wiring.** It reads `package.json` to detect Next.js (App or Pages Router), Vite, or generic Node, then idempotently:
  - Writes `imprint.config.ts`.
  - For Next.js: edits `next.config.{ts,mjs,js,cjs}` to wrap the existing `export default` with `withImprint({})`, or creates one if missing. Scaffolds `templates/ExamplePdf.tsx` and either `app/api/pdf/route.tsx` (App Router) or `pages/api/pdf.tsx` (Pages Router).
  - For Vite: inserts `imprint()` into the `plugins:` array of `vite.config.{ts,mts,js,mjs}`, scaffolds `src/templates/ExamplePdf.tsx` and a `src/pdf.ts` helper.
  - Prints a per-framework "next steps" line.
- Existing files are left untouched — re-running is safe.
