import { Document, Page, renderToBuffer } from '@imprint-pdf/react';

// ---------------------------------------------------------------------------
// Invoice template
// ---------------------------------------------------------------------------

interface LineItem {
  description: string;
  qty: number;
  rate: number;
}

const ITEMS: LineItem[] = [
  { description: 'UI/UX Design — homepage & onboarding flow', qty: 8, rate: 150 },
  { description: 'Frontend development (React + TypeScript)', qty: 24, rate: 120 },
  { description: 'API integration & backend services', qty: 12, rate: 130 },
  { description: 'QA testing & bug fixes', qty: 6, rate: 90 },
  { description: 'Project management & documentation', qty: 4, rate: 100 },
];

const TAX_RATE = 0.1;

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function Invoice({ id }: { id: string }) {
  const subtotal = ITEMS.reduce((s, i) => s + i.qty * i.rate, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  return (
    <Document title={`Invoice ${id}`}>
      <Page size="A4" className="p-12 font-sans bg-white">
        {/* Header */}
        <div className="flex flex-row justify-between items-start mb-10">
          <div>
            <span className="text-2xl font-bold text-indigo-600">Acme Studio</span>
            <span className="text-xs text-slate-500 mt-1">hello@acmestudio.io</span>
            <span className="text-xs text-slate-500">
              123 Design Street, San Francisco, CA 94105
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-400 tracking-widest">INVOICE</span>
            <span className="text-xl font-bold text-slate-900 mt-1">{id}</span>
            <div className="flex flex-row mt-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 mb-0.5">Issue date</span>
                <span className="text-xs font-semibold text-slate-900">{today}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 mb-0.5">Due date</span>
                <span className="text-xs font-semibold text-indigo-600">{due}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill-To section */}
        <div className="flex flex-row justify-between mb-10">
          <div>
            <span className="text-xs font-semibold text-indigo-600 mb-1 tracking-widest">FROM</span>
            <span className="text-sm font-bold text-slate-900 mb-0.5">Acme Studio</span>
            <span className="text-xs text-slate-500">123 Design Street</span>
            <span className="text-xs text-slate-500">San Francisco, CA 94105</span>
            <span className="text-xs text-slate-500 mt-1">hello@acmestudio.io</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-600 mb-1 tracking-widest">
              BILL TO
            </span>
            <span className="text-sm font-bold text-slate-900 mb-0.5">Globex Corporation</span>
            <span className="text-xs text-slate-500">456 Enterprise Ave</span>
            <span className="text-xs text-slate-500">New York, NY 10001</span>
            <span className="text-xs text-slate-500 mt-1">accounts@globex.com</span>
          </div>
        </div>

        {/* Table header */}
        <div className="flex flex-row items-center bg-slate-900 py-2 px-3 rounded-md mb-0.5">
          <div className="flex-1">
            <span className="text-xs font-bold text-white tracking-widest">DESCRIPTION</span>
          </div>
          <div className="w-10 text-right">
            <span className="text-xs font-bold text-white">QTY</span>
          </div>
          <div className="w-20 text-right">
            <span className="text-xs font-bold text-white">RATE</span>
          </div>
          <div className="w-24 text-right">
            <span className="text-xs font-bold text-white">AMOUNT</span>
          </div>
        </div>

        {/* Line items */}
        {ITEMS.map((item, i) => (
          <div
            key={i}
            className={`flex flex-row items-center py-2 px-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
          >
            <div className="flex-1">
              <span className="text-xs text-slate-800">{item.description}</span>
            </div>
            <div className="w-10 text-right">
              <span className="text-xs text-slate-500">{item.qty}</span>
            </div>
            <div className="w-20 text-right">
              <span className="text-xs text-slate-500">{fmt(item.rate)}</span>
            </div>
            <div className="w-24 text-right">
              <span className="text-xs font-semibold text-slate-900">
                {fmt(item.qty * item.rate)}
              </span>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="flex flex-col items-end mt-6">
          <div className="flex flex-row justify-end mb-1.5">
            <span className="text-xs text-slate-500 w-24 text-right">Subtotal</span>
            <span className="text-xs text-slate-900 w-28 text-right">{fmt(subtotal)}</span>
          </div>
          <div className="flex flex-row justify-end mb-4">
            <span className="text-xs text-slate-500 w-24 text-right">Tax (10%)</span>
            <span className="text-xs text-slate-900 w-28 text-right">{fmt(tax)}</span>
          </div>
          <div className="flex flex-row items-center bg-indigo-600 py-2.5 px-5 rounded-lg">
            <span className="text-sm font-semibold text-white mr-6">Total due</span>
            <span className="text-lg font-bold text-white">{fmt(total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-slate-50 py-4 px-5 rounded-lg mt-10">
          <span className="text-xs font-bold text-indigo-600 mb-1.5 tracking-widest">
            PAYMENT NOTE
          </span>
          <span className="text-xs text-slate-500 leading-relaxed">
            Please transfer payment to the bank account listed below within 30 days of the invoice
            date. Include the invoice number as the payment reference.
          </span>
        </div>

        {/* Footer */}
        <div className="absolute flex flex-row justify-between bottom-10 left-12 right-12">
          <span className="text-xs text-slate-400">Acme Studio</span>
          <span className="text-xs text-slate-400">
            Generated by Imprint · {new Date().getFullYear()}
          </span>
        </div>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Bun HTTP server
// ---------------------------------------------------------------------------

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname !== '/') {
      return new Response('Not found', { status: 404 });
    }

    const id = url.searchParams.get('id') ?? 'INV-001';
    const pdf = await renderToBuffer(<Invoice id={id} />);

    return new Response(pdf, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="invoice-${id}.pdf"`,
      },
    });
  },
});

console.log(`Imprint Bun server listening on http://localhost:${server.port}`);
console.log('Open http://localhost:3000?id=INV-001 in your browser to generate a PDF.');
