# examples - runtime test / bench / DX matrix

Internal cross-runtime matrix for imprint-pdf. **Not** published starters: every
adapter imports a document from the shared
[`@imprint-pdf/fixtures`](../packages/fixtures) corpus and shows only the
integration glue for its runtime. The matrix exists to (1) prove the library
compiles and renders across runtimes, (2) feed the
[benchmark suite](../packages/bench), and (3) surface per-runtime DX.

Each adapter is typecheck-gated (`pnpm typecheck`). The document is authored
once in React; the host runtime can be anything that runs JS.

## How the glue differs (6 categories)

| Cat | Runtime shape           | `pdf()` entry                          | Glue                           |
| --- | ----------------------- | -------------------------------------- | ------------------------------ |
| A   | React meta-framework    | `@imprint-pdf/next` / framework loader | return the `Response`          |
| B   | Non-React host endpoint | `@imprint-pdf/react`                   | return the `Response`          |
| C   | Node server             | `@imprint-pdf/react`                   | `{ as: 'bytes' }` → `res.send` |
| D   | Edge / serverless       | `@imprint-pdf/react/standalone`        | return `Response` / base64     |
| E   | Browser / desktop       | `@imprint-pdf/react/standalone`        | bytes → `Blob` download        |
| F   | Background (non-HTTP)   | `@imprint-pdf/react`                   | bytes → disk / store           |

## Runtimes

DX flag: 🟢 trivial glue · 🟡 extra config or a generated-types step · 🔴
notable friction.

| Runtime                                  | Cat | Entry      | What's shown                              | DX                   |
| ---------------------------------------- | --- | ---------- | ----------------------------------------- | -------------------- |
| [next-app](next-app)                     | A   | next       | App Router route handler                  | 🟢                   |
| [next-pages](next-pages)                 | A   | next       | Pages Router API route                    | 🟢                   |
| [next-server-action](next-server-action) | A   | next       | Server Action → download                  | 🟢                   |
| [remix](remix)                           | A   | react      | React Router 7 resource route (`loader`)  | 🟡 typegen           |
| [tanstack-start](tanstack-start)         | A   | react      | TanStack Start server function            | 🟡 route codegen     |
| [sveltekit](sveltekit)                   | B   | react      | `+server.ts` endpoint                     | 🟡 `svelte-kit sync` |
| [nuxt](nuxt)                             | B   | react      | Nitro `server/api` route                  | 🟡 `nuxi prepare`    |
| [astro](astro)                           | B   | react      | API endpoint                              | 🟡 `astro sync`      |
| [express](express)                       | C   | react      | `res.send(Buffer)`                        | 🟢                   |
| [fastify](fastify)                       | C   | react      | `reply.send(Buffer)`                      | 🟢                   |
| [koa](koa)                               | C   | react      | `ctx.body = Buffer`                       | 🟢                   |
| [hono-node](hono-node)                   | C   | react      | return `Response` directly                | 🟢                   |
| [nestjs](nestjs)                         | C   | react      | controller `@Res()`                       | 🟡 decorators        |
| [trpc](trpc)                             | C   | react      | procedure → base64 + `/invoice.pdf` route | 🟢                   |
| [graphql-yoga](graphql-yoga)             | C   | react      | resolver → base64 + `/invoice.pdf` route  | 🟢                   |
| [cloudflare-worker](cloudflare-worker)   | D   | standalone | `export default { fetch }`                | 🟢                   |
| [vercel-edge](vercel-edge)               | D   | standalone | Edge Function                             | 🟢                   |
| [aws-lambda](aws-lambda)                 | D   | standalone | API Gateway base64                        | 🟡 base64 hop        |
| [netlify-functions](netlify-functions)   | D   | standalone | Functions v2 `Response`                   | 🟢                   |
| [deno-deploy](deno-deploy)               | D   | standalone | `Deno.serve`                              | 🟡 Deno shim for tsc |
| [bun-elysia](bun-elysia)                 | D   | standalone | Elysia route                              | 🟡 `bun-types`       |
| [bun-server](bun-server)                 | D   | standalone | `Bun.serve`                               | 🟢                   |
| [vite-spa](vite-spa)                     | E   | standalone | in-browser render → `Blob`                | 🟢                   |
| [browser-standalone](browser-standalone) | E   | standalone | no-bundler ESM page                       | 🟡 no bundler        |
| [electron](electron)                     | E   | react      | main-process render + save dialog         | 🟡 toolchain         |
| [node-cli](node-cli)                     | F   | react      | render whole corpus to `./out/`           | 🟢                   |
| [queue-worker](queue-worker)             | F   | react      | BullMQ job → store                        | 🟡 needs Redis       |

Plus [`react18-tailwind3-nextjs`](react18-tailwind3-nextjs): a React 18 /
Tailwind v3 compatibility smoke (kept as-is).

## Document corpus

Authored once in [`@imprint-pdf/fixtures`](../packages/fixtures); every runtime
above can render any of these (`byId('<id>')`). [`node-cli`](node-cli) renders
all 15 to `./out/`.

| id               | Document            | Exercises                                         |
| ---------------- | ------------------- | ------------------------------------------------- |
| `invoice`        | Invoice             | tables, totals, Tailwind                          |
| `receipt`        | Receipt             | narrow page, compact type                         |
| `resume`         | Resume / CV         | two-column flex, typography                       |
| `cover-letter`   | Cover letter        | long prose, letterhead                            |
| `certificate`    | Certificate         | landscape, watermark, seal                        |
| `report`         | Financial report    | multi-page, header/footer, page numbers, chart    |
| `bank-statement` | Bank statement      | dense multi-page table, running balance           |
| `boarding-pass`  | Boarding pass       | fixed layout, QR + barcode, inline SVG            |
| `event-ticket`   | Event ticket        | branding, QR, perforated stub                     |
| `shipping-label` | Shipping label      | 4×6, barcode, addresses                           |
| `menu`           | Restaurant menu     | multi-column editorial                            |
| `contract`       | Contract (NDA)      | long text, page breaks, signature fields          |
| `tax-form`       | Tax form (W-9)      | AcroForm fields (text, radio, checkbox, dropdown) |
| `datasheet`      | Product datasheet   | spec table, inline-SVG image                      |
| `analytics`      | Analytics dashboard | inline-SVG charts, KPI grid                       |

## Add a runtime

No shared skeleton - each runtime's wiring differs. Copy the closest adapter for
your glue category, point its dep at `@imprint-pdf/fixtures`, swap the
framework, keep a `typecheck` script, and add a row above.
