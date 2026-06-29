# example - hono-node

Hono on Node (via `@hono/node-server`) that returns the `pdf()` `Response`
straight from the handler.

## What's shown

The thinnest Category C glue: Hono handlers can return a web `Response`, and
`pdf()` produces one by default - so the handler is a single expression with no
byte/Buffer plumbing.

```ts
app.get('/invoice', (_c) => pdf(byId('invoice')!.render()));
```

## Run

```bash
pnpm --filter @imprint-pdf/example-hono-node dev
# → http://localhost:3000/invoice
```

## DX notes

- **Category:** C (Node server, Response → response)
- **Entry:** `node` - `import { pdf } from '@imprint-pdf/react'`
- **Glue:** 1 line - return the default `pdf()` `Response`; no `as: 'bytes'`, no
  `Buffer`.
- **Rating:** 🟢 - best-in-class fit; Hono speaks the same Fetch `Response` that
  `pdf()` returns.
