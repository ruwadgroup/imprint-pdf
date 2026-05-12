# Changelog

All notable changes are documented here. See [Conventional Commits](https://www.conventionalcommits.org) and [Changesets](../../.changeset) for the release workflow.

## 1.0.0-alpha.3

### Minor

- **Tailwind v3 native dispatch.** The runner now detects the consumer's installed `tailwindcss` major and dispatches: v3 → classic PostCSS plugin against a `@tailwind base/components/utilities` stub with the full class set as `safelist`; v4 → unchanged `tw.compile()` path. Precedence: explicit `options.config` → v3, explicit `options.stylesheet` → v4, auto-detected `tailwind.config.{ts,js,mjs,cjs}` + installed v3 → v3, otherwise v4.
- **Peers broadened**: `tailwindcss` → `^3.4.0 || ^4.0.0`; `postcss` is now an optional peer (only required on v3); `vite` → `^5 || ^6 || ^7`.
