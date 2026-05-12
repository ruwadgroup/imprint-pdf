# Cookbook — Invoice

A production-grade invoice template with line items, totals, and a logo.

## What you'll build

A single-page A4 invoice with:

- Company logo (SVG)
- Bill-to / bill-from sections in a 2-column grid
- Line items table with subtotal, tax, and total
- A footer with payment terms

## Template

```tsx
// src/templates/Invoice.tsx
import { Document, Page, Image, Svg } from '@imprint-pdf/react';

interface LineItem {
  description: string;
  qty: number;
  unit: number;
}

interface InvoiceProps {
  invoice: {
    id: string;
    date: string;
    dueDate: string;
    from: { name: string; address: string[] };
    to: { name: string; address: string[] };
    items: LineItem[];
    taxRate: number;
    notes?: string;
  };
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}

export function Invoice({ invoice }: InvoiceProps) {
  const subtotal = invoice.items.reduce((s, i) => s + i.qty * i.unit, 0);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;

  return (
    <Document title={`Invoice ${invoice.id}`} lang="en">
      <Page size="A4" className="p-[48pt] font-sans text-gray-900 bg-white">
        {/* Header */}
        <div className="flex justify-between items-start">
          <Svg src={logoSvg} className="h-10 w-auto" />
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">INVOICE</p>
            <p className="mt-1 text-sm text-gray-500">#{invoice.id}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              From
            </p>
            <p className="mt-1 font-medium">{invoice.from.name}</p>
            {invoice.from.address.map((line, i) => (
              <p key={i} className="text-sm text-gray-600">
                {line}
              </p>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Bill to
            </p>
            <p className="mt-1 font-medium">{invoice.to.name}</p>
            {invoice.to.address.map((line, i) => (
              <p key={i} className="text-sm text-gray-600">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="mt-8 flex gap-8 text-sm">
          <div>
            <p className="text-gray-400">Invoice date</p>
            <p className="font-medium">{invoice.date}</p>
          </div>
          <div>
            <p className="text-gray-400">Due date</p>
            <p className="font-medium">{invoice.dueDate}</p>
          </div>
        </div>

        {/* Line items */}
        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left font-medium text-gray-500">
                Description
              </th>
              <th className="py-2 text-right font-medium text-gray-500">Qty</th>
              <th className="py-2 text-right font-medium text-gray-500">
                Unit price
              </th>
              <th className="py-2 text-right font-medium text-gray-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right">{item.qty}</td>
                <td className="py-3 text-right">{currency(item.unit)}</td>
                <td className="py-3 text-right">
                  {currency(item.qty * item.unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{currency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">
              Tax ({(invoice.taxRate * 100).toFixed(0)}%)
            </span>
            <span>{currency(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
            <span>Total</span>
            <span>{currency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-10 text-sm text-gray-500">
            <p className="font-medium text-gray-700">Notes</p>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        )}
      </Page>
    </Document>
  );
}
```

## Usage

```ts
// app/api/invoice/route.ts — Next.js
import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';

export const GET = () =>
  pdf(
    <Invoice invoice={{
      id: 'INV-001',
      date: '2026-01-15',
      dueDate: '2026-02-15',
      from: { name: 'Acme Corp', address: ['123 Main St', 'San Francisco, CA 94102'] },
      to: { name: 'Globex Corp', address: ['456 Oak Ave', 'Austin, TX 78701'] },
      items: [
        { description: 'Design system audit', qty: 1, unit: 4200 },
        { description: 'Component library', qty: 40, unit: 175 },
      ],
      taxRate: 0.08,
      notes: 'Payment due within 30 days. Thank you for your business.',
    }} />,
    { filename: 'invoice-INV-001.pdf' },
  );
```

Outside Next.js, `pdf()` from `@imprint-pdf/react` works the same — pass
`{ as: 'bytes' }` if you need a `Uint8Array` for writing to disk.
