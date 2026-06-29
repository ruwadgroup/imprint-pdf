# Architecture: runtime samples matrix (internal test/bench/DX harness)

This is the shape the user signed off on. A single **internal** fixtures package
(`@imprint-pdf/fixtures`) authored once, consumed by (a) the test matrix, (b)
the benchmark suite, and (c) many thin per-runtime adapters. These are **not** a
public library and **not** copy-paste starters - they exist to **test**,
**benchmark**, and **evaluate per-runtime DX**. No use-case document is ever
duplicated; each runtime adapter contains only its integration glue.

## 1. The two axes

- **Use-cases (documents)** - authored once in `@imprint-pdf/fixtures`.
  Feature-coverage corpus.
- **Runtimes (adapters)** - one thin example per runtime, importing the fixtures
  and showing only the glue.

```
                 documents (authored ONCE in @imprint-pdf/fixtures) ─────────►
consumers │   Invoice  Resume  Certificate  Report  Ticket  Contract  TaxForm ...
  │
 tests ───────┤   render each → assert valid PDF        (Node, vitest)
 bench ───────┤   render corpus → timings               (packages/bench)
 runtimes ────┤   express / trpc / cloudflare / ...      (thin glue, typecheck-gated)
  ▼
```

## 2. The critical contract: fixtures are runtime-agnostic

`pdf()` has **three entry points** and the fixtures package must touch **none**
of them:

| Entry                           | Use                                     | Imported by                 |
| ------------------------------- | --------------------------------------- | --------------------------- |
| `@imprint-pdf/react`            | Node host (pdf-lib native)              | Node adapters, tests, bench |
| `@imprint-pdf/react/standalone` | Edge / browser (pure WASM, no `node:*`) | Edge + browser adapters     |
| `@imprint-pdf/next`             | auto-picks node vs edge                 | Next.js adapters only       |

So `@imprint-pdf/fixtures` imports **only components and types** from
`@imprint-pdf/react` (`Document`, `Page`, `Image`, `Svg`, `Chart`, `TextField`,
`Header`, `Footer`, `PageNumber`, `Signature`, `Watermark`, ...) - never the
`pdf()` function. Each consumer calls the `pdf()` entry appropriate to its
runtime. That is the only thing that keeps one document body usable from a Node
Express route, a Cloudflare edge worker, the vitest render test, and the
benchmark runner alike.

## 3. The internal fixtures package

`packages/fixtures/` → `@imprint-pdf/fixtures` (`private: true`, never
published).

```
packages/fixtures/
  package.json            # deps: @imprint-pdf/react, @imprint-pdf/chart, react; NO pdf() call in src/**
  tsconfig.json
  src/
    index.ts              # export const documents: DocEntry[]  (the registry)
    types.ts              # DocEntry, shared prop types
    components/           # shared building blocks (Table, MoneyRow, Barcode, QR)
    invoice/              # Invoice.tsx + sample.ts  (deterministic sample props)
    resume/               # ...
    ... one folder per document
    render.test.ts        # render each via @imprint-pdf/react pdf(); assert valid PDF
```

Registry entry (the single interface every consumer reads):

```ts
// src/types.ts
import type { ComponentType, ReactElement } from 'react';

export interface DocEntry<P = unknown> {
  id: string; // 'invoice', 'resume', ...  (file/URL safe)
  title: string; // 'Invoice'
  description: string; // one line
  features: string[]; // ['tables','totals'] - which library feature it exercises
  Component: ComponentType<P>;
  sampleProps: P; // deterministic — NO Date.now()/Math.random()
  render: () => ReactElement; // <Component {...sampleProps}/>, for consumers
}
```

```ts
// src/index.ts
export const documents: DocEntry[] = [
  /* invoice, resume, ... */
];
export const byId = (id: string) => documents.find((d) => d.id === id);
```

Determinism rule: sample data is hard-coded (fixed ids, dates as strings, fixed
totals). No `Date.now()`, no `Math.random()`, no `crypto.randomUUID()`, no
argless `new Date()`. This makes every runtime + the bench render byte-identical
output and makes golden/visual tests trivial later.

### Document set (15, chosen for feature coverage)

| id             | title             | exercises                                                               |
| -------------- | ----------------- | ----------------------------------------------------------------------- |
| invoice        | Invoice           | tables, totals, Tailwind                                                |
| receipt        | Receipt           | narrow page, compact type                                               |
| resume         | Resume / CV       | flex two-column, typography                                             |
| cover-letter   | Cover letter      | long prose, letterhead, page flow                                       |
| certificate    | Certificate       | centered decorative, custom font, `<Watermark>`                         |
| report         | Financial report  | multi-page, `<Header>/<Footer>`, `<PageNumber>/<TotalPages>`, `<Chart>` |
| bank-statement | Bank statement    | dense multi-page table, page breaks                                     |
| boarding-pass  | Boarding pass     | fixed layout, QR via `<Svg>`, barcode                                   |
| event-ticket   | Event ticket      | branded, QR, image                                                      |
| shipping-label | Shipping label    | 4×6, barcode, addresses                                                 |
| menu           | Restaurant menu   | multi-column editorial, imagery                                         |
| contract       | Contract / NDA    | long text, page breaks, footnotes, `<Signature>`                        |
| tax-form       | Fillable tax form | AcroForm: `<TextField>/<Checkbox>/<RadioGroup>/<Dropdown>/<Form>`       |
| datasheet      | Product datasheet | spec table + `<Image>`                                                  |
| analytics      | Analytics report  | `@imprint-pdf/chart` vector charts, dashboard grid                      |

## 4. The six glue-pattern categories (canonical snippets)

Every runtime falls into one of six glue shapes. An adapter is "category
snippet + framework boilerplate".

**A. React meta-framework (return a `Response`/stream directly)**

```tsx
import { pdf } from '@imprint-pdf/next';
import { byId } from '@imprint-pdf/fixtures';
export const GET = () =>
  pdf(byId('invoice')!.render(), { filename: 'invoice.pdf' });
```

**B. Non-React host endpoint (SvelteKit/Nuxt/Astro - also return `Response`)**

```ts
import { pdf } from '@imprint-pdf/react';
import { byId } from '@imprint-pdf/fixtures';
export const GET = () => pdf(byId('invoice')!.render());
```

**C. Node server framework (bytes → framework's res object)**

```ts
import { pdf } from '@imprint-pdf/react';
const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
res.type('application/pdf').send(Buffer.from(bytes)); // express/fastify/koa/nest/trpc
```

**D. Edge / serverless (standalone WASM build)**

```ts
import { pdf } from '@imprint-pdf/react/standalone'; // <-- NOT the node entry
export default { fetch: () => pdf(byId('invoice')!.render()) }; // CF/Deno/Bun/Vercel-edge
// AWS Lambda: return { statusCode, body: base64(bytes), isBase64Encoded: true }
```

**E. Browser (standalone build, download a Blob)**

```ts
import { pdf } from '@imprint-pdf/react/standalone';
const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); // vite SPA / no-bundler
```

**F. Non-HTTP / background (bytes → disk or object store)**

```ts
import { pdf } from '@imprint-pdf/react';
import { writeFile } from 'node:fs/promises';
const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
await writeFile('invoice.pdf', bytes); // CLI / queue worker
```

## 5. Full runtime list (26) → category

| #   | example dir          | runtime                                         | cat | status                                        |
| --- | -------------------- | ----------------------------------------------- | --- | --------------------------------------------- |
| 1   | `next-app`           | Next.js App Router (route handler)              | A   | **migrate** existing → import fixtures        |
| 2   | `next-pages`         | Next.js Pages Router (API route)                | A   | new                                           |
| 3   | `next-server-action` | Next.js Server Action download                  | A   | new                                           |
| 4   | `remix`              | Remix / React Router 7 resource route           | A   | new                                           |
| 5   | `tanstack-start`     | TanStack Start server route                     | A   | new                                           |
| 6   | `sveltekit`          | SvelteKit `+server.ts`                          | B   | new                                           |
| 7   | `nuxt`               | Nuxt / Nitro server route                       | B   | new                                           |
| 8   | `astro`              | Astro API endpoint                              | B   | new                                           |
| 9   | `express`            | Express                                         | C   | new                                           |
| 10  | `fastify`            | Fastify                                         | C   | new                                           |
| 11  | `koa`                | Koa                                             | C   | new                                           |
| 12  | `nestjs`             | NestJS controller                               | C   | new                                           |
| 13  | `hono-node`          | Hono (Node)                                     | C   | new                                           |
| 14  | `trpc`               | tRPC procedure (+ fetch adapter download route) | C   | new                                           |
| 15  | `graphql-yoga`       | GraphQL Yoga resolver + download route          | C   | new                                           |
| 16  | `cloudflare-worker`  | Cloudflare Workers                              | D   | **migrate** existing                          |
| 17  | `vercel-edge`        | Vercel Edge Function                            | D   | new                                           |
| 18  | `aws-lambda`         | AWS Lambda + API Gateway                        | D   | new                                           |
| 19  | `netlify-functions`  | Netlify Functions                               | D   | new                                           |
| 20  | `deno-deploy`        | Deno Deploy                                     | D   | new                                           |
| 21  | `bun-elysia`         | Bun + Elysia                                    | D   | new                                           |
| 22  | `bun-server`         | Bun.serve                                       | D   | **migrate** existing                          |
| 23  | `vite-spa`           | Vite SPA (browser)                              | E   | **migrate** `vite-react`, one doc, no gallery |
| 24  | `browser-standalone` | No-bundler ESM/CDN page                         | E   | new                                           |
| 25  | `electron`           | Electron main-process render + save dialog      | E   | new                                           |
| 26  | `node-cli`           | CLI renders all docs to `./out/`                | F   | **repurpose** `pdf-test`                      |
| 27  | `queue-worker`       | BullMQ-style worker → object store              | F   | new                                           |

`react18-tailwind3-nextjs` stays as-is: the React 18 / Tailwind v3 compatibility
smoke (optionally also imports fixtures).

## 6. CI gating (typecheck-gated adapters + real render tests)

Today examples are un-gated: excluded from `build`
(`--filter='!@imprint-pdf/example-*'`) and none declare a `typecheck` script, so
`pnpm typecheck` skips them.

Change:

1. `@imprint-pdf/fixtures` (a real `packages/*` package) declares `typecheck`
   **and** `test` (vitest render tests). It is built/typechecked/tested in CI
   like any package - it is **not** under the `example-*` exclusion, which is
   why it lives in `packages/`.
2. Every example adapter gains `"typecheck": "tsc --noEmit"` (or framework
   equivalent: `svelte-check`, `nuxi typecheck`, `astro check`).
   `turbo run typecheck` then fans out to them - no CI yaml change needed.
3. The `build` job keeps `--filter='!@imprint-pdf/example-*'` (known
   browser-bundle bug, out of scope).
4. Each adapter declares its framework type-deps so `tsc --noEmit` is
   meaningful.

```
pnpm typecheck   # libs build, fixtures typecheck, every example tsc --noEmit
pnpm test        # includes @imprint-pdf/fixtures render tests (assert valid PDF per doc)
```

Per-runtime render execution in CI (Bun/Deno/edge actually running) is a
**follow-up**, not this PRD.

## 7. Benchmark integration

`packages/bench` currently carries its own `src/fixtures/invoice.tsx` +
`report.tsx` - duplicates of the corpus.

- `@imprint-pdf/bench` adds `@imprint-pdf/fixtures: "workspace:*"`.
- `packages/bench/src/fixtures/{invoice,report}.tsx` become thin re-exports from
  `@imprint-pdf/fixtures` (or are deleted and call sites repointed) - **no
  behaviour change to existing suites**.
- A new suite (`--suite documents`) renders the whole corpus and reports
  per-document timings, so growing the corpus grows bench coverage
  automatically.
- bench runs via `tsx` (consumes fixtures as source - no build step needed).

## 8. DX evaluation (lightweight, per adapter)

The matrix exists partly to judge how good the DX is per runtime. Capture it
where it is cheap:

- Each adapter `README.md` has a short **`## DX notes`** section: glue
  lines-of-code, any friction (extra config, type gymnastics, missing helper),
  and whether the runtime needed the node vs standalone entry. Keep to a few
  honest bullets.
- `examples/README.md` aggregates a **DX matrix** column (glue LoC + a 🟢/🟡/🔴
  friction flag) so weak-DX runtimes are visible at a glance and become
  follow-up library work.
- No tooling/automation for this - it is human-authored signal, not a gate.

## 9. "Add a runtime" recipe

No shared skeleton - each runtime's framework wiring genuinely differs, so
author from the category snippet:

```
1. mkdir examples/<runtime>; add package.json (name @imprint-pdf/example-<runtime>,
   framework dep, @imprint-pdf/fixtures workspace:*, "typecheck") + tsconfig
2. pick glue category (A-F), write its snippet into the one handler file
3. import { byId } from '@imprint-pdf/fixtures'
4. README.md: "what's shown" + run command + glue category + DX notes
5. add a row to examples/README.md matrix
```
