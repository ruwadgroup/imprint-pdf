# Cloudflare Workers

Imprint generates PDFs on Cloudflare Workers in under 100 ms cold start. No
dedicated package — use `@imprint-pdf/react/standalone` directly.

## The standalone build

Cloudflare Workers cannot load WASM from the filesystem at runtime. The solution
(identical to how Satori works) is to import WASM as a static module asset that
is bundled with the Worker.

```ts
// src/index.ts
import { renderToStream } from '@imprint-pdf/react/standalone';
import wasm from '@imprint-pdf/react/imprint.wasm';
import React from 'react';
import { Invoice } from './templates/Invoice';

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') ?? 'demo';

    const stream = await renderToStream(
      React.createElement(Invoice, {
        data: { id, customer: 'Acme Corp', total: 4200 },
      }),
      { wasm },
    );

    return new Response(stream, {
      headers: { 'content-type': 'application/pdf' },
    });
  },
};
```

## `wrangler.toml`

```toml
name = "imprint-pdf"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Required for WASM modules
[wasm_modules]
IMPRINT_WASM = "./node_modules/@imprint-pdf/react/dist/imprint.wasm"
```

## Fonts on Workers

Workers have no filesystem. Two options:

**Option 1 — Fetch from a CDN at render time:**

```ts
defineConfig({
  fonts: [{ family: 'Inter', src: 'https://fonts.gstatic.com/…/inter.woff2' }],
});
```

Cache the font response in Workers KV or the Cache API for subsequent requests.

**Option 2 — Bundle the font as a Wasm/module asset:**

```toml
# wrangler.toml
[[rules]]
type = "Data"
globs = ["**/*.woff2"]
```

Then import and pass it via `AssetResolver`.

## Cold start target

< 100 ms for a 1-page A4 invoice. Measured at ~60–80 ms on the free tier with
`wrangler dev --local`. Production edge timings vary by region.

## Tailwind on Workers

Static class extraction at build time (via the Vite or Webpack plugin) means
zero Tailwind processing at request time. The resolved CSS map is bundled in the
Worker. Dynamic classes and the Oxide WASM fallback are not recommended on
Workers due to the WASM size budget — keep classes static.

## Example

See [`examples/cloudflare-worker`](../../examples/cloudflare-worker).
