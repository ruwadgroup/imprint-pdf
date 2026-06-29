# example - vercel-edge

Vercel Edge Function that renders the `invoice` fixture to a PDF using the
standalone WASM build of imprint-pdf.

## What's shown

The Category D glue: an Edge Function (`runtime: 'edge'`) whose default export
returns `pdf(...)` directly. `pdf()` returns a web `Response` with the right
`Content-Type`, which is exactly what an Edge Function returns.

```ts
import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';

export const config = { runtime: 'edge' };

export default () => pdf(byId('invoice')!.render());
```

`vercel.json` rewrites `/` to `/api/invoice` so the root URL serves the PDF.

## Run

```bash
pnpm --filter @imprint-pdf/example-vercel-edge dev
# (needs the Vercel CLI: `npx vercel dev`)
# → http://localhost:3000/  (or /api/invoice)
```

## DX notes

- **Category:** D (edge runtime, standalone WASM, `Response` out)
- **Entry:** `standalone` -
  `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 1 line (`export default () => pdf(...)` - `pdf()` returns a
  `Response`)
- **Rating:** 🟢 - the `Response`-returning overload matches the Edge Function
  contract one-to-one; the only ceremony is the `config.runtime` flag.
