# example - fastify

Fastify 5 server that renders the `invoice` fixture to PDF bytes and sends them
as the reply body.

## What's shown

The Category C glue: pull a pre-built document from `@imprint-pdf/fixtures`,
call `pdf(..., { as: 'bytes' })`, and write the bytes through Fastify's reply
API.

```ts
app.get('/invoice', async (_req, reply) => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  reply.type('application/pdf').send(Buffer.from(bytes));
});
```

## Run

```bash
pnpm --filter @imprint-pdf/example-fastify dev
# → http://localhost:3000/invoice
```

## DX notes

- **Category:** C (Node server, bytes → response)
- **Entry:** `node` - `import { pdf } from '@imprint-pdf/react'`
- **Glue:** 3 lines (await `pdf`, wrap in `Buffer`, `reply.send`)
- **Rating:** 🟢 - Fastify sends a `Buffer` payload verbatim once the type is
  set.
