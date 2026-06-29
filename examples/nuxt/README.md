# example - nuxt

Nuxt 3 (Nitro) server route for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). The PDF document is
authored in React inside `@imprint-pdf/fixtures`; the Nuxt host (Vue + Nitro)
never touches React - Nitro accepts the `Response` that `pdf()` returns.

## What's shown

- **`server/api/invoice.get.ts`** - a Nitro event handler that renders the
  `invoice` fixture and returns the `Response` directly from `pdf()`.
- **`app.vue`** - a landing page linking to `/api/invoice`.

## Run

```bash
pnpm --filter @imprint-pdf/example-nuxt nuxt:prepare   # nuxi prepare → generates .nuxt/tsconfig.json + auto-import types
pnpm --filter @imprint-pdf/example-nuxt dev             # → http://localhost:3000, open /api/invoice
pnpm --filter @imprint-pdf/example-nuxt typecheck
```

## Category

**B - non-React host endpoint returns a `Response`.** The host framework is
Nuxt/Vue; the document is React. The runtime glue is one line of handler code.

## DX notes

- **Glue LoC:** 1 (the `defineEventHandler` body).
- **Entry:** `pdf` from `@imprint-pdf/react` (Node host).
- **Friction:** 🟡 - `tsconfig.json` extends the generated
  `./.nuxt/tsconfig.json`, so a `nuxi prepare` must run once before the
  auto-imported `defineEventHandler` / `defineNuxtConfig` globals and the
  extended config resolve. `typecheck` uses `nuxt typecheck`, which runs
  `nuxi prepare` for you (and needs `vue-tsc`), so the standalone friction is
  only when reading the config cold.
