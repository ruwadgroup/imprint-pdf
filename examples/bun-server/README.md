# example - bun-server

Bun HTTP server that renders the `invoice` fixture and returns the standalone
`pdf()` `Response` straight out of `Bun.serve`'s `fetch`.

## What's shown

The Category D glue: pull a pre-built document from `@imprint-pdf/fixtures` and
hand the `Response` from `@imprint-pdf/react/standalone`'s `pdf()` directly to
`Bun.serve`. No buffering, no header wiring - `fetch` returns a `Response`, and
that's exactly what `pdf()` produces.

```ts
Bun.serve({
  port: 3000,
  fetch: () => pdf(byId('invoice')!.render()),
});
```

## Run

```bash
pnpm --filter @imprint-pdf/example-bun-server dev
# → http://localhost:3000
```

## DX notes

- **Category:** D (standalone WASM runtime, `Response` → reply)
- **Entry:** standalone - `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 1 line - `fetch` returns the `pdf()` `Response` verbatim.
- **Rating:** 🟢 - Bun's `fetch` contract is the Web `Response`; `pdf()` returns
  one, so there is zero adapter code. Typechecks under plain `tsc --noEmit` with
  `bun-types` supplying the `Bun` global.
