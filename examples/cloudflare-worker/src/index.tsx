// @imprint/example-cloudflare-worker
// Cloudflare Worker that renders PDFs using the standalone WASM build of Imprint.
// Deploy with: wrangler deploy

import { Document, Page, Text, View } from '@imprint/react';
import { renderToStream } from '@imprint/react/standalone';

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
        <View className="flex flex-row justify-between items-start mb-10">
          <View>
            <Text className="text-2xl font-bold text-emerald-600">Imprint Cloud</Text>
            <Text className="text-xs text-slate-500 mt-1">billing@imprintcloud.io</Text>
          </View>
          <View className="flex flex-col items-end">
            <Text className="text-sm font-bold text-slate-400 tracking-widest">RECEIPT</Text>
            <Text className="text-xl font-bold text-slate-900 mt-1">{id}</Text>
            <Text className="text-xs text-slate-500 mt-1">{date}</Text>
          </View>
        </View>

        {/* Divider */}
        <View className="border-t border-slate-200 mb-8" />

        {/* Itemized line items */}
        <View className="flex flex-row items-center bg-slate-900 py-2 px-3 rounded-md mb-0.5">
          <View className="flex-1">
            <Text className="text-xs font-bold text-white tracking-widest">DESCRIPTION</Text>
          </View>
          <View className="w-10 text-right">
            <Text className="text-xs font-bold text-white">QTY</Text>
          </View>
          <View className="w-24 text-right">
            <Text className="text-xs font-bold text-white">UNIT PRICE</Text>
          </View>
          <View className="w-24 text-right">
            <Text className="text-xs font-bold text-white">AMOUNT</Text>
          </View>
        </View>

        {items.map((item, i) => (
          <View
            key={i}
            className={`flex flex-row items-center py-2.5 px-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
          >
            <View className="flex-1">
              <Text className="text-xs text-slate-800">{item.description}</Text>
            </View>
            <View className="w-10 text-right">
              <Text className="text-xs text-slate-500">{item.qty}</Text>
            </View>
            <View className="w-24 text-right">
              <Text className="text-xs text-slate-500">{fmt(item.unitPrice)}</Text>
            </View>
            <View className="w-24 text-right">
              <Text className="text-xs font-semibold text-slate-900">
                {fmt(item.qty * item.unitPrice)}
              </Text>
            </View>
          </View>
        ))}

        {/* Subtotal / Tax / Total */}
        <View className="flex flex-col items-end mt-6">
          <View className="flex flex-row justify-end mb-1.5">
            <Text className="text-xs text-slate-500 w-24 text-right">Subtotal</Text>
            <Text className="text-xs text-slate-900 w-28 text-right">{fmt(subtotal)}</Text>
          </View>
          <View className="flex flex-row justify-end mb-4">
            <Text className="text-xs text-slate-500 w-24 text-right">Tax (8%)</Text>
            <Text className="text-xs text-slate-900 w-28 text-right">{fmt(tax)}</Text>
          </View>
          <View className="flex flex-row items-center bg-emerald-600 py-2.5 px-5 rounded-lg">
            <Text className="text-sm font-semibold text-white mr-6">Total charged</Text>
            <Text className="text-lg font-bold text-white">{amount || fmt(total)}</Text>
          </View>
        </View>

        {/* Payment method section */}
        <View className="bg-slate-50 py-4 px-5 rounded-lg mt-10">
          <Text className="text-xs font-bold text-emerald-600 mb-2 tracking-widest">
            PAYMENT METHOD
          </Text>
          <View className="flex flex-row justify-between">
            <View>
              <Text className="text-xs text-slate-500 mb-0.5">Card</Text>
              <Text className="text-xs font-semibold text-slate-900">Visa ending in 4242</Text>
            </View>
            <View>
              <Text className="text-xs text-slate-500 mb-0.5">Status</Text>
              <Text className="text-xs font-semibold text-emerald-600">Paid</Text>
            </View>
            <View>
              <Text className="text-xs text-slate-500 mb-0.5">Date</Text>
              <Text className="text-xs font-semibold text-slate-900">{date}</Text>
            </View>
          </View>
        </View>

        {/* Thank-you footer */}
        <View className="flex flex-col items-center mt-12">
          <Text className="text-sm font-semibold text-slate-700">Thank you for your purchase!</Text>
          <Text className="text-xs text-slate-400 mt-1">
            Questions? Contact us at billing@imprintcloud.io
          </Text>
        </View>

        {/* Page footer */}
        <View className="absolute flex flex-row justify-between bottom-10 left-12 right-12">
          <Text className="text-xs text-slate-400">Imprint Cloud</Text>
          <Text className="text-xs text-slate-400">
            Generated by Imprint · {new Date().getFullYear()}
          </Text>
        </View>
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
