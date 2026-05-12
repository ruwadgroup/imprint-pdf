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

`imprint init` detects your framework (Next.js App Router or Pages, Vite, or
generic Node) and writes everything needed: `imprint.config.ts`, the
`withImprint` wrap on `next.config.{ts,mjs}` (or the `imprint()` plugin on
`vite.config.ts`), an `ExamplePdf.tsx` template, and an `/api/pdf` route or
`./src/pdf.ts` helper. Existing files are left untouched.

Create a Tailwind v4 stylesheet (CSS-first config). imprint-pdf auto-detects it
at `src/app.css`, `src/globals.css`, `app/globals.css`, and a few other
conventional locations — no extra wiring required:

```css
/* src/app.css */
@import 'tailwindcss';
@import '@imprint-pdf/react/preset';

@theme {
  --font-sans: 'Inter', sans-serif;
}
```

The generated `imprint.config.ts` only needs your fonts:

```ts
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
});
```

> If your stylesheet lives somewhere unconventional, set
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

### Node.js / server

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
Node vs Edge runtime. Pass `{ as: 'bytes' }` to get a `Uint8Array` or
`{ as: 'stream' }` for a `ReadableStream`.

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

Hot-reloads when you save. Uses the same pipeline as production.

## 6. Validate

If you have `@imprint-pdf/ua` or `@imprint-pdf/print`:

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
