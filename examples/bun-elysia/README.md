# example - bun-elysia

Elysia server on Bun that renders the `invoice` fixture and returns the
standalone `pdf()` `Response` from a route handler.

## What's shown

The Category D glue: pull a pre-built document from `@imprint-pdf/fixtures` and
return the `Response` from `@imprint-pdf/react/standalone`'s `pdf()` directly
from an Elysia route. Elysia treats a returned `Response` as the reply verbatim,
so there is no adapter code.

```ts
new Elysia().get('/invoice', () => pdf(byId('invoice')!.render())).listen(3000);
```

## Run

```bash
pnpm --filter @imprint-pdf/example-bun-elysia dev
# → http://localhost:3000/invoice
```

## DX notes

- **Category:** D (standalone WASM runtime, `Response` → reply)
- **Entry:** standalone - `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 1 line - the route returns the `pdf()` `Response` verbatim.
- **Rating:** 🟡 - Elysia ships its own types, so the handler types cleanly, but
  the file leans on the Bun runtime (`bun run`). Plain `tsc --noEmit` needs
  `bun-types` in the tsconfig `types` array to satisfy the Bun-only globals
  Elysia pulls in; once added, it typechecks without the Bun toolchain.
