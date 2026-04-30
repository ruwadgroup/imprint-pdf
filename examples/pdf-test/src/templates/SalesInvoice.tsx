import { Document, Page } from '@imprint/react';
import type { SalesOrderData } from '../data/salesOrder.js';

const fmt = (n: number) => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);

function Barcode() {
  const widths = [
    2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2,
    1, 3, 1, 2, 3, 1,
  ];
  let black = true;
  return (
    <div className="flex flex-row h-[52pt]">
      {widths.map((w, i) => {
        const bg = black ? '#1a1a1a' : '#ffffff';
        black = !black;
        return <div key={i} style={{ width: w * 2.2, height: 52, backgroundColor: bg }} />;
      })}
    </div>
  );
}

export function SalesInvoice({ data }: { data: SalesOrderData }) {
  const totals = [
    { label: 'SUBTOTAL', value: fmt(data.subtotal) },
    {
      label: `DISCOUNT (${data.discount.code}, ${data.discount.description})`,
      value: fmt(data.discount.amount),
      red: true,
    },
    { label: 'TAX', value: fmt(data.tax) },
    { label: 'SHIPPING & HANDLING', value: fmt(data.shipping) },
  ];

  return (
    <Document title={`Sales Invoice ${data.invoiceNumber}`} author={data.store.name}>
      <Page size="A4" className="bg-white px-12 py-11" style={{ fontFamily: 'Outfit' }}>
        {/* Store header */}
        <div className="flex flex-row justify-end items-center mb-5">
          <div className="flex justify-center items-center mr-2 w-[24pt] h-[24pt] bg-[#E8291D]">
            <span className="text-sm font-bold text-white">Z</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{data.store.name}</span>
        </div>

        {/* Title */}
        <div className="flex flex-row items-end mb-7">
          <h1 className="text-4xl font-bold text-gray-900 mr-2">Sales</h1>
          <h1 className="text-4xl text-gray-900">Invoice</h1>
        </div>

        {/* Invoice meta */}
        <div className="flex flex-row mb-8">
          <div className="mr-4 w-[3pt] bg-[#E8291D]" />
          <div className="flex-1">
            {[
              { label: 'INVOICE NUMBER', value: data.invoiceNumber },
              { label: 'ORDER', value: data.orderNumber },
              { label: 'ORDER DATE', value: data.orderDate },
            ].map((row, i, arr) => (
              <div
                key={i}
                className={`flex flex-row items-center ${i < arr.length - 1 ? 'mb-2' : ''}`}
              >
                <span className="text-xs font-bold text-gray-900 w-[110pt]">{row.label}</span>
                <span className="text-xs font-bold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-end justify-center">
            <Barcode />
          </div>
        </div>

        {/* Customer info + items */}
        <div className="flex flex-row items-start">
          <div className="mr-5 w-[155pt]">
            {[
              { label: 'CUSTOMER NAME', value: data.customer.name },
              { label: 'ADDRESS', value: data.customer.address },
              { label: 'SHIPPING METHOD', value: data.customer.shippingMethod },
              { label: 'PAYMENT METHOD', value: data.customer.paymentMethod },
            ].map((info, i) => (
              <div key={i} className="mb-3">
                <span className="text-xs font-bold mb-0.5 text-[#E8291D] tracking-[0.8pt]">
                  {info.label}
                </span>
                {info.value.split('\n').map((line, j) => (
                  <p key={j} className="text-xs text-gray-800 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="flex-1">
            {/* Column headers */}
            <div className="flex flex-row items-center py-2 px-2.5 bg-[#E8291D]">
              <div className="flex-1">
                <span className="text-xs font-bold text-white tracking-[0.8pt]">ITEMS</span>
              </div>
              <div className="w-[50pt]">
                <span className="text-xs font-bold text-white text-center tracking-[0.8pt]">
                  QTY
                </span>
              </div>
              <div className="w-[72pt]">
                <span className="text-xs font-bold text-white text-right tracking-[0.8pt]">
                  SUBTOTAL
                </span>
              </div>
            </div>

            {/* Line items */}
            <div className="px-2.5">
              {data.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex flex-row items-center py-2.5 ${i < data.items.length - 1 ? 'border-b-[1pt] border-b-[#e0e0e0]' : ''}`}
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 mb-0.5">{item.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  </div>
                  <div className="w-[50pt]">
                    <span className="text-xs text-gray-900 text-center">{item.qty}</span>
                  </div>
                  <div className="w-[72pt]">
                    <span className="text-xs text-gray-900 text-right">{fmt(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 mb-3 h-[1pt] bg-[#e0e0e0]" />

            {/* Subtotals */}
            {totals.map((row, i) => (
              <div key={i} className="flex flex-row justify-end mb-1.5">
                <span className="text-xs text-gray-500 text-right mr-3 flex-1">{row.label}</span>
                <span
                  className={`text-xs text-right w-[72pt] ${row.red ? 'text-[#E8291D]' : 'text-gray-900'}`}
                >
                  {row.value}
                </span>
              </div>
            ))}

            {/* Grand total */}
            <div className="flex flex-row justify-end mt-1">
              <div className="flex-1 mr-3">
                <span className="text-sm font-bold text-gray-900 text-right">GRAND TOTAL</span>
              </div>
              <span className="text-sm font-bold text-gray-900 text-right w-[72pt]">
                {fmt(data.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute flex flex-col items-center bottom-[44pt] left-[48pt] right-[48pt]">
          <p className="text-sm font-bold text-gray-900 mb-1.5">Thank you for your order!</p>
          <p className="text-xs text-gray-500 mb-2.5">
            If you have questions, email us at support@stripesshop.com.
          </p>
          <p className="text-xs font-bold text-gray-900 mb-0.5">{data.store.name}</p>
          {data.store.address.split('\n').map((line, i) => (
            <p key={i} className="text-xs text-gray-500 text-center leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </Page>
    </Document>
  );
}
