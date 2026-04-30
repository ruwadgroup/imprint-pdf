# Quick start

Five minutes from empty project to a real PDF.

## 1. Install

```bash
pnpm add @imprint/react @imprint/core
pnpm add -D @imprint/cli @imprint/tailwind tailwindcss
```

## 2. Initialise

```bash
npx imprint init
```

Edit the generated `imprint.config.ts`:

```ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
  tailwind: { config: './tailwind.config.ts' },
});
```

## 3. Write a component

```tsx
// src/templates/Invoice.tsx
import { Document, Page } from '@imprint/react';

interface InvoiceProps {
  invoice: { id: string; customer: string; total: number };
}

export function Invoice({ invoice }: InvoiceProps) {
  return (
    <Document>
      <Page size="A4" className="p-12 font-sans bg-white text-gray-900">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
          <span className="text-sm text-gray-500">#{invoice.id}</span>
        </div>
        <div className="mt-8">
          <p className="text-sm font-medium text-gray-500">Bill to</p>
          <p className="mt-1 text-base">{invoice.customer}</p>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-4 flex justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">
            ${invoice.total.toLocaleString()}
          </span>
        </div>
      </Page>
    </Document>
  );
}
```

## 4. Render

### Node.js / server

```ts
// src/generate.ts
import { renderToBuffer } from '@imprint/react';
import { Invoice } from './templates/Invoice';
import { writeFileSync } from 'node:fs';

const pdf = await renderToBuffer(
  <Invoice invoice={{ id: 'INV-001', customer: 'Acme Corp', total: 4200 }} />
);

writeFileSync('./out/invoice.pdf', pdf);
```

```bash
npx tsx src/generate.ts
open out/invoice.pdf
```

### Next.js route handler

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
  const pdf = await renderToServer(<Invoice invoice={data} />);

  return new Response(pdf, {
    headers: { 'content-type': 'application/pdf' },
  });
}
```

### Browser (Vite)

```ts
// src/App.tsx
import { renderToBuffer } from '@imprint/react';
import { Invoice } from './templates/Invoice';

async function download() {
  const pdf = await renderToBuffer(
    <Invoice invoice={{ id: 'INV-001', customer: 'Acme Corp', total: 4200 }} />
  );
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  window.open(url);
}
```

## 5. Preview locally

```bash
npx imprint dev src/templates/Invoice.tsx
# → http://localhost:4000
```

Hot-reloads when you save. Uses the same pipeline as production.

## 6. Validate (Enterprise)

If you have `@imprint/ua` or `@imprint/print`:

```bash
npx imprint validate ./out/invoice.pdf --profile pdf-ua-1
```

Exits non-zero on failure — wire it into CI.

## What's next

- **[Concepts](concepts.md)** — how the pipeline fits together
- **[Tailwind guide](guides/tailwind.md)** — what's supported, what's dropped
- **[Typography](guides/typography.md)** — fonts, shaping, Knuth–Plass
- **[Next.js](frameworks/nextjs.md)** or **[Vite](frameworks/vite.md)** —
  framework setup
- **[Cookbook](README.md#cookbook)** — real-world recipes
