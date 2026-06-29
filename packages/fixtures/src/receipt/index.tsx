import { Document, Page } from '@imprint-pdf/react';
import { Barcode } from '../components/Barcode.js';
import { money, sumBy } from '../lib/format.js';
import type { ReceiptData } from './sample.js';

export type { ReceiptData, ReceiptItem } from './sample.js';
export { receiptSample } from './sample.js';

export interface ReceiptProps {
  data: ReceiptData;
}

// Narrow ~80mm thermal receipt: 226pt wide (~80mm) on a snug strip that hugs
// its content rather than floating on a full A4 sheet.
const PAGE_W = 226;
const PAGE_H = 384;

// Hairline dotted rule, the visual rhythm of a thermal receipt.
const Dotted = () => <div className="my-2.5 border-t border-dotted border-slate-400" />;

// A single ledger row with a qty x unit subline under the item name.
function Line({ name, qty, price }: { name: string; qty: number; price: number }) {
  return (
    <div className="flex flex-row items-baseline justify-between py-[1.5px]">
      <div className="flex flex-1 flex-col pr-3">
        <span className="text-[9px] leading-tight text-slate-900">{name}</span>
        <span className="text-[8px] leading-tight text-slate-400">
          {qty} &times; {money(price)}
        </span>
      </div>
      <span className="text-[9px] tabular-nums text-slate-900">{money(qty * price)}</span>
    </div>
  );
}

// Right-aligned summary row (subtotal / tax).
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-row items-baseline justify-between py-[1.5px]">
      <span className="text-[9px] text-slate-500">{label}</span>
      <span className="text-[9px] tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

export function Receipt({ data }: ReceiptProps) {
  const subtotal = sumBy(data.items, (i) => i.qty * i.price);
  const tax = subtotal * data.taxRate;
  const total = subtotal + tax;
  const count = sumBy(data.items, (i) => i.qty);
  const monogram = data.merchant.trim().charAt(0).toUpperCase();

  return (
    <Document title={`Receipt ${data.receiptNo}`} author={data.merchant}>
      <Page
        size={[PAGE_W, PAGE_H]}
        sizeUnit="pt"
        className="bg-white px-5 pb-5 pt-6 font-mono text-slate-900"
      >
        {/* Masthead: a filled rounded-square monogram over the centered store
            name + contact. */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-700">
            <span className="text-[13px] font-bold text-white">{monogram}</span>
          </div>
          <h1 className="mt-2 text-center text-[12px] font-bold uppercase tracking-[2pt] text-slate-900">
            {data.merchant}
          </h1>
          <p className="mt-1.5 max-w-[150px] text-center text-[8px] leading-snug text-slate-500">
            {data.address}
          </p>
          <p className="text-[8px] leading-snug text-slate-500">{data.phone}</p>
        </div>

        <Dotted />

        {/* Transaction meta. */}
        <div className="flex flex-col gap-[1px]">
          <div className="flex flex-row justify-between">
            <span className="text-[8px] text-slate-500">RECEIPT</span>
            <span className="text-[8px] tabular-nums text-slate-900">{data.receiptNo}</span>
          </div>
          <div className="flex flex-row justify-between">
            <span className="text-[8px] text-slate-500">DATE</span>
            <span className="text-[8px] tabular-nums text-slate-900">{data.date}</span>
          </div>
          <div className="flex flex-row justify-between">
            <span className="text-[8px] text-slate-500">CASHIER</span>
            <span className="text-[8px] text-slate-900">{data.cashier}</span>
          </div>
        </div>

        <Dotted />

        {/* Column header for the ledger. */}
        <div className="flex flex-row justify-between pb-1">
          <span className="text-[7px] uppercase tracking-[1pt] text-slate-400">Item</span>
          <span className="text-[7px] uppercase tracking-[1pt] text-slate-400">Amount</span>
        </div>

        <div className="flex flex-col">
          {data.items.map((item, i) => (
            <Line key={i} name={item.name} qty={item.qty} price={item.price} />
          ))}
        </div>

        <Dotted />

        {/* Subtotal / tax block. */}
        <div className="flex flex-col">
          <Summary label="Subtotal" value={money(subtotal)} />
          <Summary label={`Tax (${(data.taxRate * 100).toFixed(1)}%)`} value={money(tax)} />
        </div>

        {/* Bold total emphasis row. */}
        <div className="mt-2 flex flex-row items-center justify-between bg-teal-700 px-2.5 py-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[1.5pt] text-white">Total</span>
          <span className="text-[13px] font-bold tabular-nums text-white">{money(total)}</span>
        </div>

        {/* Payment line. */}
        <div className="mt-2 flex flex-row items-baseline justify-between">
          <span className="text-[8px] text-slate-500">PAID</span>
          <span className="text-[8px] text-slate-900">{data.paymentMethod}</span>
        </div>
        <div className="flex flex-row items-baseline justify-between">
          <span className="text-[8px] text-slate-500">ITEMS</span>
          <span className="text-[8px] tabular-nums text-slate-900">{count}</span>
        </div>

        <Dotted />

        {/* Centered barcode with caption. */}
        <div className="mt-1 flex flex-col items-center">
          <Barcode value={data.barcodeValue} width={170} height={42} />
          <span className="mt-1.5 text-[8px] tracking-[1.5pt] text-slate-500">
            {data.barcodeValue}
          </span>
        </div>

        {/* Footer. */}
        <div className="mt-4 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[3pt] text-teal-700">
            Thank You
          </span>
          <span className="mt-1 text-[8px] text-slate-400">Please come again</span>
        </div>
      </Page>
    </Document>
  );
}
