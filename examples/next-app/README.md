# example - next-app

**What's shown:** Next.js App Router route handler that renders the shared
`invoice` fixture to a PDF `Response` via `@imprint-pdf/next`.

```bash
pnpm --filter @imprint-pdf/example-next-app dev
# then GET http://localhost:3000/api/invoice
```

The document lives in `@imprint-pdf/fixtures`; this adapter is pure runtime
glue. `src/app/api/invoice/route.ts`:

```ts
import { pdf } from '@imprint-pdf/next';
import { byId } from '@imprint-pdf/fixtures';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = () =>
  pdf(byId('invoice')!.render(), { filename: 'invoice.pdf' });
```

## DX notes

- **Category:** A - React meta-framework, returns a `Response`.
- **Glue LoC:** 4 (route handler body + two route segment configs).
- **Entry:** `@imprint-pdf/next` `pdf` (Node `runtime = 'nodejs'`). Not the
  `standalone` build - App Router route handlers run on Node here.
- **Friction:** 🟢 - `pdf()` returns a `Response` directly, so the handler is a
  one-liner. `next.config.ts` keeps the WASM/externals webpack tweaks inline.
