# @imprint/next

Next.js App Router integration for
[Imprint](https://github.com/tamimbinhakim/imprint).

```bash
pnpm add @imprint/next @imprint/react @imprint/core
```

## Plugin

```ts
// next.config.ts
import { withImprint } from '@imprint/next/plugin';

export default withImprint()({
  // your Next.js config
});
```

The plugin wires up:

- Compile-time Tailwind extraction via `@imprint/tailwind/webpack`
- `.woff2` font imports
- WASM loading configuration for the standalone edge build

## Route handler

The canonical pattern for PDF generation in Next.js App Router:

```ts
// app/api/invoice/[id]/route.ts
import { renderToServer } from '@imprint/next';
import { Invoice } from '@/templates/Invoice';
import { getInvoice } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const data = await getInvoice(params.id);
  const pdf = await renderToServer(<Invoice data={data} />);

  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="invoice-${params.id}.pdf"`,
    },
  });
}
```

## RSC helper

```tsx
// app/invoice/[id]/page.tsx
import { getT } from '@imprint/next';
import { PreviewFrame } from '@/components/PreviewFrame';

export default async function InvoicePage({ params }) {
  return <PreviewFrame invoiceId={params.id} />;
}
```

## Edge deployment

To deploy the route handler to the Next.js Edge Runtime, use the standalone
build:

```ts
// app/api/invoice/[id]/route.ts
export const runtime = 'edge';

import { renderToEdge } from '@imprint/next';
```

## Exports

| Entry                  | Purpose                              |
| ---------------------- | ------------------------------------ |
| `@imprint/next`        | `renderToServer`, `getImprintConfig` |
| `@imprint/next/plugin` | `withImprint` Next.js plugin wrapper |
