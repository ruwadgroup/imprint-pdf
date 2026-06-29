# example - netlify-functions

Netlify Function (v2) that renders the `invoice` fixture to a PDF using the
standalone WASM build of imprint-pdf.

## What's shown

The Category D glue: a v2 Netlify Function whose default export returns a web
`Response`. `pdf()` already produces one with the right `Content-Type`, so the
handler is a single expression. `config.path` maps it to a clean `/invoice` URL.

```ts
import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';
import type { Config } from '@netlify/functions';

export default async () => pdf(byId('invoice')!.render());

export const config: Config = { path: '/invoice' };
```

## Run

```bash
pnpm --filter @imprint-pdf/example-netlify-functions dev
# (needs the Netlify CLI: `npx netlify dev`)
# → http://localhost:8888/invoice
```

## DX notes

- **Category:** D (serverless, standalone WASM, `Response` out)
- **Entry:** `standalone` -
  `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 1 line (`export default async () => pdf(...)` - `pdf()` returns a
  `Response`)
- **Rating:** 🟢 - Functions v2 returns a web `Response`, the exact shape
  `pdf()` hands back; the `Config` import only buys the custom route.
