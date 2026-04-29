# example — cloudflare-worker

Cloudflare Worker demo for [Imprint](https://github.com/tamimbinhakim/imprint).
Generates a PDF invoice on the edge in under 100 ms cold start.

```bash
pnpm --filter @imprint/example-cloudflare-worker dev
# → http://localhost:8787
```

## What's demonstrated

- **`src/index.ts`** — a Cloudflare Worker that accepts `GET /invoice/:id`,
  renders an `<Invoice>` component with `renderToStream`, and returns the PDF
  with `content-type: application/pdf`.
- **`src/templates/Invoice.tsx`** — an invoice component that uses Tailwind
  classes and runs identically on the Worker and in Node.
- **`wrangler.toml`** — WASM asset configuration so Imprint's WASM modules are
  bundled as static assets (the pattern from Satori's `standalone` build).

## Key pattern

```ts
// src/index.ts
import { renderToStream } from '@imprint/react/standalone';
import wasm from '@imprint/react/imprint.wasm';

export default {
  async fetch(req: Request): Promise<Response> {
    const stream = await renderToStream(<Invoice />, { wasm });
    return new Response(stream, {
      headers: { 'content-type': 'application/pdf' },
    });
  },
};
```

## Structure

```
examples/cloudflare-worker/
├── src/
│   ├── index.ts
│   └── templates/Invoice.tsx
├── imprint.config.ts
└── wrangler.toml
```
