# example - koa

Koa server (with `@koa/router`) that renders the `invoice` fixture to PDF bytes
and assigns them to the response body.

## What's shown

The Category C glue: pull a pre-built document from `@imprint-pdf/fixtures`,
call `pdf(..., { as: 'bytes' })`, and assign the bytes to `ctx.body`.

```ts
router.get('/invoice', async (ctx) => {
  ctx.type = 'application/pdf';
  ctx.body = Buffer.from(await pdf(byId('invoice')!.render(), { as: 'bytes' }));
});
```

## Run

```bash
pnpm --filter @imprint-pdf/example-koa dev
# → http://localhost:3000/invoice
```

## DX notes

- **Category:** C (Node server, bytes → response)
- **Entry:** `node` - `import { pdf } from '@imprint-pdf/react'`
- **Glue:** 2 lines (set `ctx.type`, assign a `Buffer` to `ctx.body`)
- **Rating:** 🟢 - Koa serializes a `Buffer` body directly.
