# example - next-pages

**What's shown:** Next.js **Pages Router** API route that renders the shared
`invoice` fixture to PDF bytes and writes them to the `res` stream.

```bash
pnpm --filter @imprint-pdf/example-next-pages dev
# then GET http://localhost:3000/api/invoice
```

`pages/api/invoice.ts`:

```ts
const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
res.setHeader('content-type', 'application/pdf');
res.send(Buffer.from(bytes));
```

## DX notes

- **Category:** A - React meta-framework. Pages Router uses the Node
  `(req, res)` handler, so we return **bytes** rather than a `Response`.
- **Glue LoC:** 5 (await `pdf` → set headers → `res.send`).
- **Entry:** `@imprint-pdf/next` `pdf` with `{ as: 'bytes' }` (Node serverless
  runtime). Not the `standalone` build - Pages API routes run on Node.
- **Friction:** 🟡 - one extra step vs App Router: `pdf()` can't return a
  `Response` to the Node `res` object, so you bridge with `Buffer.from(bytes)`
  and set the headers yourself.
