# example - graphql-yoga

GraphQL Yoga runtime adapter for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Category **C**
(Node, bytes).

## What's shown

GraphQL has no binary scalar, so this adapter demonstrates the two-route
pattern, both served from one `node:http` server (`src/server.ts`):

- **GraphQL** - a `Query.invoicePdf: String!` resolver that renders the
  `invoice` fixture and returns the bytes base64-encoded. This is the "real"
  GraphQL output.
- **Download** - a non-GraphQL `GET /invoice.pdf` route that streams the raw
  bytes as `application/pdf`; every other path falls through to Yoga.

## Run

```bash
pnpm --filter @imprint-pdf/example-graphql-yoga dev
# GraphQL: http://localhost:3000/graphql
#   query { invoicePdf }   → "JVBERi0…" (base64)
# PDF:     http://localhost:3000/invoice.pdf  → binary application/pdf
```

## DX notes

- Yoga's instance is callable as a Node request listener, so wrapping it behind
  a tiny `node:http` router to add the binary route costs nothing.
