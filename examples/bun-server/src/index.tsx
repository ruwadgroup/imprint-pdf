import { Document, Page, renderToBuffer, Text, View } from '@imprint/react';

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
        <View className="flex flex-row justify-between items-start mb-10">
          <View>
            <Text className="text-2xl font-bold text-indigo-600">Acme Studio</Text>
            <Text className="text-xs text-slate-500 mt-1">hello@acmestudio.io</Text>
            <Text className="text-xs text-slate-500">
              123 Design Street, San Francisco, CA 94105
            </Text>
          </View>
          <View className="flex flex-col items-end">
            <Text className="text-sm font-bold text-slate-400 tracking-widest">INVOICE</Text>
            <Text className="text-xl font-bold text-slate-900 mt-1">{id}</Text>
            <View className="flex flex-row mt-2 gap-4">
              <View>
                <Text className="text-xs text-slate-400 mb-0.5">Issue date</Text>
                <Text className="text-xs font-semibold text-slate-900">{today}</Text>
              </View>
              <View>
                <Text className="text-xs text-slate-400 mb-0.5">Due date</Text>
                <Text className="text-xs font-semibold text-indigo-600">{due}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bill-To section */}
        <View className="flex flex-row justify-between mb-10">
          <View>
            <Text className="text-xs font-semibold text-indigo-600 mb-1 tracking-widest">FROM</Text>
            <Text className="text-sm font-bold text-slate-900 mb-0.5">Acme Studio</Text>
            <Text className="text-xs text-slate-500">123 Design Street</Text>
            <Text className="text-xs text-slate-500">San Francisco, CA 94105</Text>
            <Text className="text-xs text-slate-500 mt-1">hello@acmestudio.io</Text>
          </View>
          <View>
            <Text className="text-xs font-semibold text-indigo-600 mb-1 tracking-widest">
              BILL TO
            </Text>
            <Text className="text-sm font-bold text-slate-900 mb-0.5">Globex Corporation</Text>
            <Text className="text-xs text-slate-500">456 Enterprise Ave</Text>
            <Text className="text-xs text-slate-500">New York, NY 10001</Text>
            <Text className="text-xs text-slate-500 mt-1">accounts@globex.com</Text>
          </View>
        </View>

        {/* Table header */}
        <View className="flex flex-row items-center bg-slate-900 py-2 px-3 rounded-md mb-0.5">
          <View className="flex-1">
            <Text className="text-xs font-bold text-white tracking-widest">DESCRIPTION</Text>
          </View>
          <View className="w-10 text-right">
            <Text className="text-xs font-bold text-white">QTY</Text>
          </View>
          <View className="w-20 text-right">
            <Text className="text-xs font-bold text-white">RATE</Text>
          </View>
          <View className="w-24 text-right">
            <Text className="text-xs font-bold text-white">AMOUNT</Text>
          </View>
        </View>

        {/* Line items */}
        {ITEMS.map((item, i) => (
          <View
            key={i}
            className={`flex flex-row items-center py-2 px-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
          >
            <View className="flex-1">
              <Text className="text-xs text-slate-800">{item.description}</Text>
            </View>
            <View className="w-10 text-right">
              <Text className="text-xs text-slate-500">{item.qty}</Text>
            </View>
            <View className="w-20 text-right">
              <Text className="text-xs text-slate-500">{fmt(item.rate)}</Text>
            </View>
            <View className="w-24 text-right">
              <Text className="text-xs font-semibold text-slate-900">
                {fmt(item.qty * item.rate)}
              </Text>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View className="flex flex-col items-end mt-6">
          <View className="flex flex-row justify-end mb-1.5">
            <Text className="text-xs text-slate-500 w-24 text-right">Subtotal</Text>
            <Text className="text-xs text-slate-900 w-28 text-right">{fmt(subtotal)}</Text>
          </View>
          <View className="flex flex-row justify-end mb-4">
            <Text className="text-xs text-slate-500 w-24 text-right">Tax (10%)</Text>
            <Text className="text-xs text-slate-900 w-28 text-right">{fmt(tax)}</Text>
          </View>
          <View className="flex flex-row items-center bg-indigo-600 py-2.5 px-5 rounded-lg">
            <Text className="text-sm font-semibold text-white mr-6">Total due</Text>
            <Text className="text-lg font-bold text-white">{fmt(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        <View className="bg-slate-50 py-4 px-5 rounded-lg mt-10">
          <Text className="text-xs font-bold text-indigo-600 mb-1.5 tracking-widest">
            PAYMENT NOTE
          </Text>
          <Text className="text-xs text-slate-500 leading-relaxed">
            Please transfer payment to the bank account listed below within 30 days of the invoice
            date. Include the invoice number as the payment reference.
          </Text>
        </View>

        {/* Footer */}
        <View className="absolute flex flex-row justify-between bottom-10 left-12 right-12">
          <Text className="text-xs text-slate-400">Acme Studio</Text>
          <Text className="text-xs text-slate-400">
            Generated by Imprint · {new Date().getFullYear()}
          </Text>
        </View>
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
