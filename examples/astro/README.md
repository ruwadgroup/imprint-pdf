# example - astro

Astro endpoint for [imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf),
running on the `@astrojs/node` adapter in `output: 'server'` mode. The PDF
document is authored in React inside `@imprint-pdf/fixtures`; the Astro host
never touches React - the endpoint just returns the `Response` that `pdf()`
produces.

## What's shown

- **`src/pages/api/invoice.ts`** - an `APIRoute` `GET` handler that renders the
  `invoice` fixture and returns the `Response` straight from `pdf()`.
- **`src/pages/index.astro`** - a landing page linking to `/api/invoice`.

## Run

```bash
pnpm --filter @imprint-pdf/example-astro sync       # astro sync → generates .astro/types.d.ts
pnpm --filter @imprint-pdf/example-astro dev         # → http://localhost:4321, open /api/invoice
pnpm --filter @imprint-pdf/example-astro typecheck
```

## Category

**B - non-React host endpoint returns a `Response`.** The host framework is
Astro; the document is React. The runtime glue is one line of endpoint code.

## DX notes

- **Glue LoC:** 1 (the `GET` handler body).
- **Entry:** `pdf` from `@imprint-pdf/react` (Node host).
- **Friction:** 🟡 - `tsconfig.json` includes the generated `.astro/types.d.ts`,
  so an `astro sync` must run once before types resolve. `typecheck` uses
  `astro check` (which runs `astro sync` for you and needs `@astrojs/check` +
  `typescript`), so the standalone friction is only when reading the config
  cold.
