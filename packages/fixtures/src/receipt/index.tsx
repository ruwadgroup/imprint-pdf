import { Document, Page } from '@imprint-pdf/react';
import { Barcode } from '../components/Barcode.js';
import { money, sumBy } from '../lib/format.js';
import type { ReceiptData } from './sample.js';

export type { ReceiptData, ReceiptItem } from './sample.js';
export { receiptSample } from './sample.js';

export interface ReceiptProps {
  data: ReceiptData;
}

const Divider = () => <div className="border-t border-dashed border-slate-400 my-2" />;

export function Receipt({ data }: ReceiptProps) {
  const subtotal = sumBy(data.items, (i) => i.qty * i.price);
  const tax = subtotal * data.taxRate;
  const total = subtotal + tax;

  return (
    <Document title={`Receipt ${data.receiptNo}`} author={data.merchant}>
      <Page className="bg-white px-4 py-5 font-mono text-slate-900" style={{ width: 226 }}>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-bold tracking-[1pt] uppercase">{data.merchant}</h1>
          <p className="text-[8px] text-slate-600 mt-1 text-center leading-tight">{data.address}</p>
          <p className="text-[8px] text-slate-600 leading-tight">{data.phone}</p>
        </div>

        <Divider />

        <div className="flex flex-row justify-between">
          <span className="text-[8px] text-slate-600">Receipt</span>
          <span className="text-[8px] text-slate-900">{data.receiptNo}</span>
        </div>
        <div className="flex flex-row justify-between">
          <span className="text-[8px] text-slate-600">Date</span>
          <span className="text-[8px] text-slate-900">{data.date}</span>
        </div>
        <div className="flex flex-row justify-between">
          <span className="text-[8px] text-slate-600">Cashier</span>
          <span className="text-[8px] text-slate-900">{data.cashier}</span>
        </div>

        <Divider />

        <div className="flex flex-col">
          {data.items.map((item, i) => (
            <div key={i} className="flex flex-row justify-between py-0.5">
              <div className="flex flex-col flex-1 pr-2">
                <span className="text-[9px] text-slate-900">{item.name}</span>
                <span className="text-[8px] text-slate-500">
                  {item.qty} × {money(item.price)}
                </span>
              </div>
              <span className="text-[9px] text-slate-900">{money(item.qty * item.price)}</span>
            </div>
          ))}
        </div>

        <Divider />

        <div className="flex flex-row justify-between py-0.5">
          <span className="text-[9px] text-slate-600">Subtotal</span>
          <span className="text-[9px] text-slate-900">{money(subtotal)}</span>
        </div>
        <div className="flex flex-row justify-between py-0.5">
          <span className="text-[9px] text-slate-600">
            Tax ({(data.taxRate * 100).toFixed(1)}%)
          </span>
          <span className="text-[9px] text-slate-900">{money(tax)}</span>
        </div>
        <div className="flex flex-row justify-between py-1 mt-1 border-t border-slate-400">
          <span className="text-sm font-bold text-slate-900">TOTAL</span>
          <span className="text-sm font-bold text-slate-900">{money(total)}</span>
        </div>
        <div className="flex flex-row justify-between py-0.5">
          <span className="text-[8px] text-slate-600">Paid</span>
          <span className="text-[8px] text-slate-900">{data.paymentMethod}</span>
        </div>

        <Divider />

        <div className="flex flex-col items-center mt-2">
          <Barcode value={data.barcodeValue} width={170} height={42} />
          <span className="text-[8px] text-slate-600 mt-1 tracking-[1pt]">{data.barcodeValue}</span>
        </div>

        <div className="flex flex-col items-center mt-3">
          <span className="text-[9px] font-bold text-slate-900">THANK YOU!</span>
          <span className="text-[8px] text-slate-500 mt-0.5">Please come again</span>
        </div>
      </Page>
    </Document>
  );
}
