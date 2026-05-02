# @imprint-pdf/next

Next.js App Router integration for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf).

```bash
pnpm add @imprint-pdf/next @imprint-pdf/react @imprint-pdf/core
```

## Plugin

```ts
// next.config.ts
import { withImprint } from '@imprint-pdf/next/plugin';

export default withImprint()({
  // your Next.js config
});
```

The plugin wires up:

- Compile-time Tailwind extraction via `@imprint-pdf/tailwind/webpack`
- `asyncWebAssembly` + `layers` webpack experiments and a `webassembly/async`
  rule for `.wasm` files (required by the renderer)
- `serverExternalPackages` entries for `@imprint-pdf/react` and
  `@imprint-pdf/core` so Next.js doesn't bundle their server-only internals

## Route handler

The canonical pattern for PDF generation in Next.js App Router:

```ts
// app/api/invoice/[id]/route.ts
import { renderToServer } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';
import { getInvoice } from '@/lib/db';

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
      'content-disposition': `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
```

Or use `createPdfResponse` to skip the header boilerplate:

```ts
import { createPdfResponse } from '@imprint-pdf/next';

return createPdfResponse(<Invoice data={data} />, {
  filename: `invoice-${id}.pdf`,
  disposition: 'attachment',
});
```

## RSC helper

`getImprintConfig()` reads `imprint.config.{ts,js,mjs,cjs}` from the project
root from a Server Component, so a Client Component can do the actual render
with shared font / Tailwind config.

```tsx
// app/invoice/[id]/page.tsx
import { getImprintConfig } from '@imprint-pdf/next';
import { PreviewFrame } from '@/components/PreviewFrame';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = await getImprintConfig();
  return <PreviewFrame invoiceId={id} imprintConfig={config} />;
}
```

## Edge deployment

To deploy the route handler to the Next.js Edge Runtime, use the standalone
build:

```ts
// app/api/invoice/[id]/route.ts
export const runtime = 'edge';

import { renderToEdge } from '@imprint-pdf/next';
```

## Exports

| Entry                      | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `@imprint-pdf/next`        | `renderToServer`, `renderToEdge`, `createPdfResponse`, `getImprintConfig` |
| `@imprint-pdf/next/plugin` | `withImprint` Next.js plugin wrapper                                      |
