import { Document, Page } from '@imprint-pdf/react';
import { Table, Td, Th, Tr } from '../components/Table.js';
import { money, sumBy } from '../lib/format.js';
import type { InvoiceData } from './sample.js';

export type { InvoiceData, InvoiceItem } from './sample.js';
export { invoiceSample } from './sample.js';

export interface InvoiceProps {
  data: InvoiceData;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-row items-baseline border-l-2 border-indigo-600 pl-2.5">
      <span className="w-20 text-[8px] font-semibold uppercase tracking-[1.5pt] text-slate-400">
        {label}
      </span>
      <span className="text-[10px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export function Invoice({ data }: InvoiceProps) {
  const subtotal = sumBy(data.items, (i) => i.qty * i.rate);
  const tax = subtotal * data.taxRate;
  const total = subtotal + tax;

  return (
    <Document title={`Invoice ${data.number}`} author={data.from.name}>
      <Page size="A4" className="flex flex-col bg-white px-16 pb-14 pt-14 font-sans text-slate-900">
        {/* Masthead */}
        <div className="flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <h1 className="text-[34px] font-bold leading-none tracking-[-1pt]">Invoice</h1>
            <span className="mt-2 text-[12px] font-semibold text-indigo-600">{data.number}</span>
          </div>
          <div className="flex flex-col items-end gap-2.5">
            <div className="flex flex-row items-center gap-2">
              <div className="relative h-[18px] w-[18px]">
                <div className="absolute left-0 top-0 h-[13px] w-[13px] rounded-sm bg-indigo-600" />
                <div className="absolute bottom-0 right-0 h-[13px] w-[13px] rounded-sm bg-slate-900" />
              </div>
              <span className="text-[12px] font-bold tracking-[-0.2pt]">{data.from.name}</span>
            </div>
            <p className="text-[9px] text-slate-500">{data.from.email}</p>
          </div>
        </div>

        <div className="my-10 h-px bg-slate-200" />

        {/* Bill-to + meta */}
        <div className="mb-10 flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-semibold uppercase tracking-[1.5pt] text-slate-400">
              Billed to
            </span>
            <p className="mt-1.5 text-[13px] font-bold">{data.to.name}</p>
            <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-slate-500">
              {data.to.address}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <MetaRow label="Issued" value={data.date} />
            <MetaRow label="Due" value={data.dueDate} />
          </div>
        </div>

        <Table>
          <Tr className="bg-indigo-600 px-4">
            <Th flex>Description</Th>
            <Th align="right" width={50}>
              Qty
            </Th>
            <Th align="right" width={90}>
              Rate
            </Th>
            <Th align="right" width={104}>
              Amount
            </Th>
          </Tr>
          {data.items.map((item, i) => (
            <Tr key={i} className="border-b border-slate-100 px-4">
              <Td flex className="text-[11px] font-semibold text-slate-900">
                {item.description}
              </Td>
              <Td align="right" width={50} className="text-[10px] text-slate-600">
                {item.qty}
              </Td>
              <Td align="right" width={90} className="text-[10px] text-slate-600">
                {money(item.rate)}
              </Td>
              <Td align="right" width={104} className="text-[11px] font-bold text-slate-900">
                {money(item.qty * item.rate)}
              </Td>
            </Tr>
          ))}
        </Table>

        <div className="mt-8 flex flex-row justify-end">
          <div className="flex w-[270px] flex-col">
            <div className="flex flex-row justify-between py-1.5">
              <span className="text-[10px] text-slate-500">Subtotal</span>
              <span className="text-[10px] font-semibold text-slate-900">{money(subtotal)}</span>
            </div>
            <div className="flex flex-row justify-between border-b border-slate-200 py-1.5">
              <span className="text-[10px] text-slate-500">
                Tax ({(data.taxRate * 100).toFixed(2)}%)
              </span>
              <span className="text-[10px] font-semibold text-slate-900">{money(tax)}</span>
            </div>
            <div className="mt-3 flex flex-row items-center justify-between rounded-md bg-slate-900 px-4 py-3">
              <span className="text-[9px] font-semibold uppercase tracking-[1.5pt] text-slate-300">
                Total due
              </span>
              <span className="text-[19px] font-bold text-white">{money(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />
        <div className="mt-10 flex flex-row items-stretch gap-3 rounded-md bg-slate-50 px-4 py-3">
          <div className="w-[3px] rounded-sm bg-indigo-600" />
          <div className="flex flex-col">
            <span className="text-[8px] font-semibold uppercase tracking-[1.5pt] text-slate-400">
              Notes
            </span>
            <p className="mt-1 text-[9.5px] leading-relaxed text-slate-500">{data.notes}</p>
          </div>
        </div>
      </Page>
    </Document>
  );
}
