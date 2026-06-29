# Examples - runtime matrix

imprint-pdf's `pdf()` returns a `Response` (or `Uint8Array` / `ReadableStream`),
so the document is authored once in React and the host runtime can be anything
that runs JS. The [`examples/`](../examples/README.md) directory proves this
with an adapter per runtime - an internal **test / benchmark / DX matrix**, not
published starters.

Every adapter imports a document from the shared
[`@imprint-pdf/fixtures`](../packages/fixtures) corpus and shows only the
integration glue. All adapters are typecheck-gated in CI.

See **[`examples/README.md`](../examples/README.md)** for the full table.

## Runtimes by glue category

- **A - React meta-frameworks**: Next.js (App Router, Pages Router, Server
  Action), Remix / React Router 7, TanStack Start.
- **B - Non-React hosts**: SvelteKit, Nuxt, Astro - the document is React, the
  endpoint just returns `pdf()`'s `Response`.
- **C - Node servers**: Express, Fastify, Koa, Hono, NestJS, tRPC, GraphQL Yoga.
- **D - Edge / serverless** (standalone WASM build): Cloudflare Workers, Vercel
  Edge, AWS Lambda, Netlify Functions, Deno Deploy, Bun + Elysia, Bun.serve.
- **E - Browser / desktop**: Vite SPA, no-bundler ESM page, Electron.
- **F - Background**: Node CLI (renders the whole corpus), BullMQ worker.

## The two `pdf()` entries

- `@imprint-pdf/react` - Node host.
- `@imprint-pdf/react` - pure-WASM build for edge and browser (no `node:*`).
- `@imprint-pdf/next` - auto-picks node vs edge for Next.js.

## Document corpus

The same 15 documents (invoice, receipt, resume, certificate, report, bank
statement, boarding pass, contract, fillable W-9 form, analytics dashboard, ...)
back the matrix, the render tests, and the
[benchmark suite](../packages/bench)'s `documents` suite. See the
[corpus table](../examples/README.md#document-corpus).
