// @imprint-pdf/example-cloudflare-worker
// Cloudflare Worker that renders PDFs using the standalone WASM build of imprint-pdf.
// Deploy with: wrangler deploy

import { Document, Page } from '@imprint-pdf/react';
import { renderToStream } from '@imprint-pdf/react/standalone';

// ---------------------------------------------------------------------------
// Receipt template
// ---------------------------------------------------------------------------

interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

interface ReceiptProps {
  id: string;
  amount: string;
  date: string;
}

function Receipt({ id, amount, date }: ReceiptProps) {
  const items: LineItem[] = [
    { description: 'Pro Plan subscription (monthly)', qty: 1, unitPrice: 49.0 },
    { description: 'Additional team seats (×3)', qty: 3, unitPrice: 12.0 },
    { description: 'Priority support add-on', qty: 1, unitPrice: 19.0 },
  ];

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <Document title={`Receipt ${id}`}>
      <Page size="A4" className="p-12 font-sans bg-white">
        {/* Company logo area */}
        <div className="flex flex-row justify-between items-start mb-10">
          <div>
            <span className="text-2xl font-bold text-emerald-600">imprint-pdf Cloud</span>
            <span className="text-xs text-slate-500 mt-1">billing@imprintcloud.io</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-400 tracking-widest">RECEIPT</span>
            <span className="text-xl font-bold text-slate-900 mt-1">{id}</span>
            <span className="text-xs text-slate-500 mt-1">{date}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 mb-8" />

        {/* Itemized line items */}
        <div className="flex flex-row items-center bg-slate-900 py-2 px-3 rounded-md mb-0.5">
          <div className="flex-1">
            <span className="text-xs font-bold text-white tracking-widest">DESCRIPTION</span>
          </div>
          <div className="w-10 text-right">
            <span className="text-xs font-bold text-white">QTY</span>
          </div>
          <div className="w-24 text-right">
            <span className="text-xs font-bold text-white">UNIT PRICE</span>
          </div>
          <div className="w-24 text-right">
            <span className="text-xs font-bold text-white">AMOUNT</span>
          </div>
        </div>

        {items.map((item, i) => (
          <div
            key={i}
            className={`flex flex-row items-center py-2.5 px-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
          >
            <div className="flex-1">
              <span className="text-xs text-slate-800">{item.description}</span>
            </div>
            <div className="w-10 text-right">
              <span className="text-xs text-slate-500">{item.qty}</span>
            </div>
            <div className="w-24 text-right">
              <span className="text-xs text-slate-500">{fmt(item.unitPrice)}</span>
            </div>
            <div className="w-24 text-right">
              <span className="text-xs font-semibold text-slate-900">
                {fmt(item.qty * item.unitPrice)}
              </span>
            </div>
          </div>
        ))}

        {/* Subtotal / Tax / Total */}
        <div className="flex flex-col items-end mt-6">
          <div className="flex flex-row justify-end mb-1.5">
            <span className="text-xs text-slate-500 w-24 text-right">Subtotal</span>
            <span className="text-xs text-slate-900 w-28 text-right">{fmt(subtotal)}</span>
          </div>
          <div className="flex flex-row justify-end mb-4">
            <span className="text-xs text-slate-500 w-24 text-right">Tax (8%)</span>
            <span className="text-xs text-slate-900 w-28 text-right">{fmt(tax)}</span>
          </div>
          <div className="flex flex-row items-center bg-emerald-600 py-2.5 px-5 rounded-lg">
            <span className="text-sm font-semibold text-white mr-6">Total charged</span>
            <span className="text-lg font-bold text-white">{amount || fmt(total)}</span>
          </div>
        </div>

        {/* Payment method section */}
        <div className="bg-slate-50 py-4 px-5 rounded-lg mt-10">
          <span className="text-xs font-bold text-emerald-600 mb-2 tracking-widest">
            PAYMENT METHOD
          </span>
          <div className="flex flex-row justify-between">
            <div>
              <span className="text-xs text-slate-500 mb-0.5">Card</span>
              <span className="text-xs font-semibold text-slate-900">Visa ending in 4242</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 mb-0.5">Status</span>
              <span className="text-xs font-semibold text-emerald-600">Paid</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 mb-0.5">Date</span>
              <span className="text-xs font-semibold text-slate-900">{date}</span>
            </div>
          </div>
        </div>

        {/* Thank-you footer */}
        <div className="flex flex-col items-center mt-12">
          <span className="text-sm font-semibold text-slate-700">Thank you for your purchase!</span>
          <span className="text-xs text-slate-400 mt-1">
            Questions? Contact us at billing@imprintcloud.io
          </span>
        </div>

        {/* Page footer */}
        <div className="absolute flex flex-row justify-between bottom-10 left-12 right-12">
          <span className="text-xs text-slate-400">imprint-pdf Cloud</span>
          <span className="text-xs text-slate-400">
            Generated by imprint-pdf · {new Date().getFullYear()}
          </span>
        </div>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Worker handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    const id = url.searchParams.get('id') ?? 'RCP-001';
    const amount = url.searchParams.get('amount') ?? '';
    const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

    const stream = await renderToStream(<Receipt id={id} amount={amount} date={date} />);

    return new Response(stream, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="receipt-${id}.pdf"`,
      },
    });
  },
} satisfies ExportedHandler;
