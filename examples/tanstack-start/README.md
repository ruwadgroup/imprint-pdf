# example - tanstack-start

TanStack Start **server route**: a GET handler that returns a raw PDF
`Response`.

## What's shown

- **`src/routes/api/invoice.ts`** - the entire runtime glue. The current Start
  API folds server routes into `createFileRoute(...)` via `server.handlers` (the
  old `createServerFileRoute` / `createAPIFileRoute` are gone). The `GET`
  handler returns `pdf(byId('invoice')!.render())`; `pdf()` (Node entry,
  `@imprint-pdf/react`) yields a `Response` with the right
  `Content-Type: application/pdf` headers, returned verbatim.
- **`src/routes/__root.tsx`**, **`src/routes/index.tsx`**, **`src/router.tsx`**
  - minimal Start scaffolding plus an index page linking to `/api/invoice`.

> The route lives at `src/routes/api/invoice.ts` (Start's default routes
> directory) rather than `app/routes/...`; using the default avoids a custom
> `tsr` config.

## Run

```bash
pnpm --filter @imprint-pdf/example-tanstack-start dev
# → http://localhost:3000  →  click "Download invoice.pdf"  (or GET /api/invoice)
```

## Category

**B** - server framework returning a `Response` from a server route handler.

## DX notes

- **Glue LoC:** ~6 (the `createFileRoute(...).server.handlers.GET` block).
- **Entry:** `@imprint-pdf/react` `pdf()` (Node runtime, Nitro server).
- **Friction:** 🟡 - needs a **codegen step before `tsc` passes**.
  `src/router.tsx` imports `./routeTree.gen`, which does not exist until the
  route tree is generated. The Start Vite plugin writes it on `vite dev` /
  `vite build`; for a standalone typecheck the `typecheck` script runs the
  router CLI first: `tsr generate && tsc --noEmit`. We also set
  `verbatimModuleSyntax: false` (Start's docs warn it can leak server code into
  the client bundle).

## Codegen

```bash
tsr generate     # writes src/routeTree.gen.ts (run before tsc --noEmit)
```
