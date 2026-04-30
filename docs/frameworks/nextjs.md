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
2. Configures `@next/font` passthrough for `.woff2` files.
3. Sets up WASM loading for both Node and Edge targets.

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

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')!;
  const stream = await renderToEdge(<Invoice data={{ id }} />);

  return new Response(stream, {
    headers: { 'content-type': 'application/pdf' },
  });
}
```

## Server Component helper

```tsx
// app/invoice/[id]/page.tsx
import { getImprintConfig } from '@imprint/next';

export default async function InvoicePage({ params }) {
  const config = await getImprintConfig();
  // Pass config to a Client Component that calls renderToBuffer
  return <InvoicePreview invoiceId={params.id} imprintConfig={config} />;
}
```

## Streaming

```ts
const stream = await renderToEdge(<Invoice data={data} />, { streaming: true });
// First byte arrives in < 50 ms for most documents
return new Response(stream, { headers: { 'content-type': 'application/pdf' } });
```

## Caching route handler output

```ts
export const revalidate = 3600; // revalidate every hour

export async function GET(req: Request, { params }) {
  const data = await getInvoice(params.id);
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
  tailwind: { config: './tailwind.config.ts' },
});
```

The `withImprint` plugin auto-detects `imprint.config.ts` in the project root.
