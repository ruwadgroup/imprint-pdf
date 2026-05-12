# Next.js

First-class Next.js App Router support — route handlers, RSC helpers, Edge
Runtime, and the `withImprint` plugin.

## Install

```bash
pnpm add @imprint-pdf/next @imprint-pdf/react @imprint-pdf/core tailwindcss
```

## Plugin

```ts
// next.config.ts
import { withImprint } from '@imprint-pdf/next/plugin';

export default withImprint()({
  // your Next.js config
});
```

`withImprint()` does three things:

1. Registers the webpack plugin for compile-time class extraction (webpack only
   — Turbopack falls back to runtime compile).
2. Enables the `asyncWebAssembly` and `layers` webpack experiments and adds a
   `webassembly/async` rule for `.wasm` files (required by the renderer).
3. Adds `@imprint-pdf/react` and `@imprint-pdf/core` to `serverExternalPackages`
   so Next.js doesn't bundle their server-only internals.

## Route handler

```ts
// app/api/invoice/[id]/route.ts
import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';
import { getInvoice } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getInvoice(id);
  return pdf(<Invoice data={data} />, {
    filename: `invoice-${id}.pdf`,
    disposition: 'attachment', // or 'inline' (default)
  });
}
```

`pdf()` returns a `Response`, auto-loads `imprint.config.ts`, and auto-detects
Node vs Edge runtime.

## Edge Runtime

Set `runtime = 'edge'` on the route — that's it. `pdf()` detects
`NEXT_RUNTIME === 'edge'` and switches to the standalone WASM-only bundle.

```ts
// app/api/invoice/[id]/route.ts
export const runtime = 'edge';

import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return pdf(<Invoice data={{ id }} />, { as: 'stream' });
}
```

`{ as: 'stream' }` returns a `ReadableStream<Uint8Array>` — useful when you want
to wrap it yourself (e.g. compose with another transform). The default
`as: 'response'` is what most edge routes want.

## Power-user output shapes

| Shape                            | Use case                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| `pdf(<Doc />)` (default)         | Web framework integration — returns a `Response`.           |
| `pdf(<Doc />, { as: 'bytes' })`  | Writing to disk, attaching to email, custom HTTP framework. |
| `pdf(<Doc />, { as: 'stream' })` | Edge runtimes with tight memory budgets.                    |

## Caching route handler output

```ts
export const revalidate = 3600; // revalidate every hour

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getInvoice(id);
  const response = await pdf(<Invoice data={data} />);
  // Append your own cache headers on top of the defaults.
  response.headers.set('cache-control', 'public, max-age=3600');
  return response;
}
```

## `imprint.config.ts` in Next.js projects

```ts
// imprint.config.ts (project root)
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
  // tailwind.stylesheet is auto-detected from app/globals.css, src/app.css, …
});
```

The `withImprint` plugin auto-detects `imprint.config.ts` in the project root.
