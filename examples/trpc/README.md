# example - trpc

tRPC v11 standalone runtime adapter for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Category **C**
(Node, bytes).

## What's shown

PDF bytes don't travel well over a typed JSON-RPC boundary, so this adapter
demonstrates the two-route pattern:

- **RPC (`src/router.ts`)** - an `invoice` query (zod-validated input, defaults
  to the `invoice` fixture) that returns `{ pdf: <base64> }`. This is the "real"
  tRPC output: a typed, serializable payload.
- **Download (`src/server.ts`)** - a plain `node:http` server that streams the
  raw bytes as `application/pdf` on `GET /invoice.pdf`, and delegates every
  other path to tRPC's `createHTTPHandler`.

## Run

```bash
pnpm --filter @imprint-pdf/example-trpc dev
# RPC: http://localhost:3000/invoice   → { "pdf": "JVBERi0…" } (base64)
# PDF: http://localhost:3000/invoice.pdf  → binary application/pdf
```

## DX notes

- The single `node:http` server multiplexes the binary route and the tRPC
  handler - no second port, no framework.
- `AppRouter` is exported for end-to-end type inference on a tRPC client.
