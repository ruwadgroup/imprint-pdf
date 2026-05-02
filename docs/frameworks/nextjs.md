# Next.js

First-class Next.js App Router support — route handlers, RSC helpers, Edge
Runtime, and the `withImprint` plugin.

## Install

```bash
pnpm add @imprint/next @imprint/react @imprint/core
pnpm add -D @imprint/tailwind tailwindcss
```

## Plugin

```ts
// next.config.ts
import { withImprint } from '@imprint/next/plugin';

export default withImprint()({
  // your Next.js config
});
```

`withImprint()` does three things:

1. Wires `@imprint/tailwind/webpack` for compile-time class extraction.
2. Enables the `asyncWebAssembly` and `layers` webpack experiments and adds a
   `webassembly/async` rule for `.wasm` files (required by the renderer).
3. Adds `@imprint/react` and `@imprint/core` to `serverExternalPackages` so
   Next.js doesn't bundle their server-only internals.

## Route handler (Node runtime)

```ts
// app/api/invoice/[id]/route.ts
import { renderToServer } from '@imprint/next';
import { Invoice } from '@/templates/Invoice';
import { getInvoice } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getInvoice(id);

  const pdf = await renderToServer(<Invoice data={data} />);

  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
```

## Route handler (Edge Runtime)

```ts
// app/api/invoice/[id]/route.ts
export const runtime = 'edge';

import { renderToEdge } from '@imprint/next';
import { Invoice } from '@/templates/Invoice';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stream = await renderToEdge(<Invoice data={{ id }} />);

  return new Response(stream, {
    headers: { 'content-type': 'application/pdf' },
  });
}
```

`renderToEdge` always returns a `ReadableStream<Uint8Array>` — there is no
separate "streaming mode" to enable.

## Server Component helper

```tsx
// app/invoice/[id]/page.tsx
import { getImprintConfig } from '@imprint/next';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = await getImprintConfig();
  // Pass config to a Client Component that calls renderToBuffer
  return <InvoicePreview invoiceId={id} imprintConfig={config} />;
}
```

`getImprintConfig()` walks `imprint.config.{ts,js,mjs,cjs}` candidates from the
project root and returns the parsed config (or `{}` if none is found).

## One-line PDF response

`createPdfResponse` is a convenience wrapper around `renderToServer` that builds
a `Response` with the right `Content-Type`, `Content-Length`, and
`Content-Disposition` headers for you:

```ts
import { createPdfResponse } from '@imprint/next';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getInvoice(id);

  return createPdfResponse(<Invoice data={data} />, {
    filename: `invoice-${id}.pdf`,
    disposition: 'attachment', // or 'inline' (default)
  });
}
```

## Streaming

`renderToEdge` already returns a `ReadableStream<Uint8Array>` — pipe it straight
into a `Response`:

```ts
const stream = await renderToEdge(<Invoice data={data} />);
// First byte arrives in < 50 ms for most documents
return new Response(stream, { headers: { 'content-type': 'application/pdf' } });
```

## Caching route handler output

```ts
export const revalidate = 3600; // revalidate every hour

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getInvoice(id);
  const pdf = await renderToServer(<Invoice data={data} />);

  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'cache-control': 'public, max-age=3600',
    },
  });
}
```

## `imprint.config.ts` in Next.js projects

```ts
// imprint.config.ts (project root)
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
  // tailwind.stylesheet is auto-detected from app/globals.css, src/app.css, …
});
```

The `withImprint` plugin auto-detects `imprint.config.ts` in the project root.
