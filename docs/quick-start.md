# Quick start

Five minutes from empty project to a real PDF.

## 1. Install

```bash
pnpm add @imprint-pdf/react @imprint-pdf/core tailwindcss
pnpm add -D @imprint-pdf/cli
```

## 2. Initialise

```bash
npx imprint init
```

`imprint init` detects your framework (Next.js, Vite, or generic Node) and
writes the rest: `imprint.config.ts`, the right plugin wired into your
`next.config.{ts,mjs}` or `vite.config.ts`, an `ExamplePdf.tsx` template, and an
`/api/pdf` route (or `./src/pdf.ts` helper for Vite). Existing files are left
alone.

Author your Tailwind v4 stylesheet as you normally would. imprint-pdf
auto-detects it at `src/app.css`, `src/globals.css`, `app/globals.css`, and a
few other conventional locations:

```css
/* src/app.css */
@import 'tailwindcss';
@import '@imprint-pdf/react/preset';

@theme {
  --font-sans: 'Inter', sans-serif;
}
```

`@imprint-pdf/react/preset` registers the page-position variants (`page-first:`,
`page-left:`, `page-right:`) Tailwind needs to know about so it compiles
`page-first:p-12` correctly.

```ts
// imprint.config.ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
});
```

> If your stylesheet lives somewhere unusual, set
> `tailwind: { stylesheet: './path/to/your.css' }` explicitly.

## 3. Write a component

```tsx
// src/templates/Invoice.tsx
import { Document, Page } from '@imprint-pdf/react';

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

### Node.js

```ts
// src/generate.ts
import { pdf } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';
import { writeFileSync } from 'node:fs';

const bytes = await pdf(
  <Invoice invoice={{ id: 'INV-001', customer: 'Acme Corp', total: 4200 }} />,
  { as: 'bytes' },
);

writeFileSync('./out/invoice.pdf', bytes);
```

```bash
npx tsx src/generate.ts
open out/invoice.pdf
```

### Next.js route handler

```ts
// app/api/invoice/[id]/route.ts
import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';
import { getInvoice } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getInvoice(id);
  return pdf(<Invoice invoice={data} />, { filename: `invoice-${id}.pdf` });
}
```

`pdf()` returns a `Response`, auto-loads `imprint.config.ts`, and auto-detects
Node vs Edge runtime. `{ as: 'bytes' }` gives a `Uint8Array`; `{ as: 'stream' }`
gives a `ReadableStream`.

### Browser (Vite)

```ts
// src/App.tsx
import { pdf } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

async function download() {
  const response = await pdf(
    <Invoice invoice={{ id: 'INV-001', customer: 'Acme Corp', total: 4200 }} />
  );
  window.open(URL.createObjectURL(await response.blob()));
}
```

## 5. Preview locally

```bash
npx imprint dev src/templates/Invoice.tsx
# → http://localhost:4000
```

Hot-reloads when you save. Same pipeline as production.

## 6. Validate

With `@imprint-pdf/ua` or `@imprint-pdf/print` installed:

```bash
npx imprint validate ./out/invoice.pdf --profile pdf-ua-1
```

Non-zero on failure — wire it into CI.

## Where to go next

- [Concepts](concepts.md) — how the pipeline fits together
- [Tailwind](guides/tailwind.md) — what's supported, what isn't
- [Typography](guides/typography.md) — fonts, shaping, Knuth–Plass
- [Next.js](frameworks/nextjs.md) · [Vite](frameworks/vite.md) ·
  [Bun](frameworks/bun.md) · [Cloudflare](frameworks/cloudflare.md)
- [Cookbook](README.md#cookbook) — invoices, contracts, reports
