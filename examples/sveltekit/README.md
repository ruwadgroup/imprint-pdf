# example - sveltekit

SvelteKit endpoint for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). The PDF document is
authored in React inside `@imprint-pdf/fixtures`; the SvelteKit host never
touches React - `pdf()` hands it back a `Response` and the endpoint returns it.

## What's shown

- **`src/routes/invoice/+server.ts`** - a single `GET` handler that renders the
  `invoice` fixture and returns the `Response` straight from `pdf()`.
- **`src/routes/+page.svelte`** - a landing page linking to `/invoice`.

## Run

```bash
pnpm --filter @imprint-pdf/example-sveltekit sync   # svelte-kit sync → generates .svelte-kit/tsconfig.json + $types
pnpm --filter @imprint-pdf/example-sveltekit dev     # → http://localhost:5173, open /invoice
pnpm --filter @imprint-pdf/example-sveltekit typecheck
```

## Category

**B - non-React host endpoint returns a `Response`.** The host framework is
Svelte; the document is React. The runtime glue is one line of endpoint code.

## DX notes

- **Glue LoC:** 1 (the `GET` handler body).
- **Entry:** `pdf` from `@imprint-pdf/react` (Node host).
- **Friction:** 🟡 - `tsconfig.json` extends the generated
  `./.svelte-kit/tsconfig.json`, so a `svelte-kit sync` (or any
  `vite dev`/`build`) must run once before typecheck resolves. `typecheck` uses
  `svelte-check`, which runs `svelte-kit sync` for you, so the standalone
  friction is only when reading the config cold.
