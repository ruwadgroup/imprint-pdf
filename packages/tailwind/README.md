# @imprint-pdf/tailwind (internal)

> **This package is internal to the
> [imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf) monorepo. It's not
> published to npm.** Its code is inlined into `@imprint-pdf/react`,
> `@imprint-pdf/next`, and `@imprint-pdf/vite` at build time — those are the
> packages you actually install.
>
> If you're looking for Tailwind integration docs, see
> [docs/integrations/tailwind-config.md](https://github.com/tamimbinhakim/imprint-pdf/blob/main/docs/integrations/tailwind-config.md).

## What's in here

- `tw-runner.ts` — runtime tailwind compile (v3 and v4 dispatch).
- `css-to-styles.ts` — CSS → resolved style map.
- `vite.ts` — Vite plugin for compile-time class extraction.
- `webpack.ts` — Webpack plugin for compile-time class extraction.
- `runtime.ts` — small re-export surface.

These get bundled into the consumer packages' dist via `tsup`'s `noExternal`, so
no separate npm install is needed.
