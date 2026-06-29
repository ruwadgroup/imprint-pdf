# example - express

Express 5 server that renders the `invoice` fixture to PDF bytes and sends them
as the response body.

## What's shown

The Category C glue: pull a pre-built document from `@imprint-pdf/fixtures`,
call `pdf(..., { as: 'bytes' })`, and write the bytes through Express's response
API.

```ts
app.get('/invoice', async (_req, res) => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  res.type('application/pdf').send(Buffer.from(bytes));
});
```

## Run

```bash
pnpm --filter @imprint-pdf/example-express dev
# → http://localhost:3000/invoice
```

## DX notes

- **Category:** C (Node server, bytes → response)
- **Entry:** `node` - `import { pdf } from '@imprint-pdf/react'`
- **Glue:** 3 lines (await `pdf`, wrap in `Buffer`, `res.send`)
- **Rating:** 🟢 - Express 5's plain `res.send(Buffer)` takes the bytes
  directly.
