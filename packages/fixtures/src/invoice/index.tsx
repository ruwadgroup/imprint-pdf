import { Document, Page } from '@imprint-pdf/react/standalone';
import { Table, Td, Th, Tr } from '../components/Table.js';
import { money, sumBy } from '../lib/format.js';
import type { InvoiceData } from './sample.js';

export type { InvoiceData, InvoiceItem } from './sample.js';
export { invoiceSample } from './sample.js';

export interface InvoiceProps {
  data: InvoiceData;
}

export function Invoice({ data }: InvoiceProps) {
  const subtotal = sumBy(data.items, (i) => i.qty * i.rate);
  const tax = subtotal * data.taxRate;
  const total = subtotal + tax;

  return (
    <Document title={`Invoice ${data.number}`} author={data.from.name}>
      <Page size="A4" className="bg-white px-14 py-12 font-sans text-slate-900">
        <div className="flex flex-row justify-between items-start mb-12">
          <div>
            <h2 className="text-2xl font-bold text-indigo-600">{data.from.name}</h2>
            <p className="text-xs text-slate-500 mt-1">{data.from.email}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-400 tracking-[2pt]">INVOICE</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{data.number}</p>
            <div className="flex flex-row mt-2">
              <div className="mr-4 flex flex-col">
                <span className="text-xs text-slate-500 mb-0.5">Issue date</span>
                <p className="text-xs font-semibold text-slate-900">{data.date}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 mb-0.5">Due date</span>
                <p className="text-xs font-semibold text-slate-900">{data.dueDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col">
          <span className="text-xs text-slate-400 font-semibold tracking-[1pt] mb-1">BILL TO</span>
          <p className="text-sm font-semibold text-slate-900">{data.to.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{data.to.address}</p>
        </div>

        <Table>
          <Tr className="bg-indigo-600 rounded-t px-4">
            <Th flex>Description</Th>
            <Th align="right" width={60}>
              Qty
            </Th>
            <Th align="right" width={90}>
              Rate
            </Th>
            <Th align="right" width={100}>
              Amount
            </Th>
          </Tr>
          {data.items.map((item, i) => (
            <Tr key={i} className={`px-4 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
              <Td flex>{item.description}</Td>
              <Td align="right" width={60}>
                {item.qty}
              </Td>
              <Td align="right" width={90}>
                {money(item.rate)}
              </Td>
              <Td align="right" width={100}>
                {money(item.qty * item.rate)}
              </Td>
            </Tr>
          ))}
        </Table>

        <div className="flex flex-row justify-end mt-6">
          <div className="flex flex-col" style={{ width: 240 }}>
            <div className="flex flex-row justify-between py-1">
              <span className="text-xs text-slate-500">Subtotal</span>
              <span className="text-xs text-slate-900">{money(subtotal)}</span>
            </div>
            <div className="flex flex-row justify-between py-1">
              <span className="text-xs text-slate-500">
                Tax ({(data.taxRate * 100).toFixed(2)}%)
              </span>
              <span className="text-xs text-slate-900">{money(tax)}</span>
            </div>
            <div className="flex flex-row justify-between py-2 mt-1 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-sm font-bold text-indigo-600">{money(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />
        <div className="border-t border-slate-200 pt-4 mt-8">
          <span className="text-xs text-slate-400 font-semibold tracking-[1pt]">NOTES</span>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{data.notes}</p>
        </div>
      </Page>
    </Document>
  );
}
