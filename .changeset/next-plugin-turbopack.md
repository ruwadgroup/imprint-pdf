---
'@imprint-pdf/next': minor
---

`withImprint` now supports Turbopack (Next 16's default bundler).

The plugin adds a `turbopack.resolveAlias` for `virtual:imprint-classes` →
`@imprint-pdf/tailwind/runtime` so Tailwind's runtime fallback resolves under
Turbopack. The webpack branch is unchanged. Any pre-existing user `turbopack`
config is preserved (the alias only adds itself when absent).

Before this fix, anyone on a recent Next.js app would silently render unstyled
PDFs because the compile-time `ImprintWebpackPlugin` is webpack-only and
Turbopack had no equivalent.

Also: `createPdfResponse` / `renderToServer` / `renderToEdge` (now the
deprecated aliases for `pdf()`) auto-load `imprint.config.ts` from the project
root and merge with caller-supplied options. Previously the config was accepted
by `defineConfig` and the plugin but silently ignored at render time, producing
unstyled output if the caller didn't pass `tailwind` / `fonts` explicitly.
