import { Document, Page } from '@imprint-pdf/react';
import { Eyebrow } from '../components/index.js';
import { Table, Td, Th, Tr } from '../components/Table.js';
import { money, sumBy } from '../lib/format.js';
import type { InvoiceData } from './sample.js';

export type { InvoiceData, InvoiceItem } from './sample.js';
export { invoiceSample } from './sample.js';

export interface InvoiceProps {
  data: InvoiceData;
}

// Studio invoice. One confident accent (indigo), quiet metadata columns, a
// dark line-item table with muted SKU subtitles, a discount-aware totals stack
// closed by a double rule, and small-print footer. Mono for every figure/code
// so columns line up and the numbers read as data. Pure Tailwind.

/** "24 Harbor Lane, Sausalito, CA 94965" → ["24 Harbor Lane", "Sausalito, CA 94965"]. */
function addressLines(address: string): string[] {
  const idx = address.indexOf(', ');
  if (idx === -1) return [address];
  return [address.slice(0, idx), address.slice(idx + 2)];
}

function MetaCol({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <Eyebrow>{label}</Eyebrow>
      <span
        className={`mt-1.5 text-sm font-semibold text-slate-900 ${
          mono ? 'font-mono tracking-[-0.2pt]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  className = '',
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-row items-baseline justify-between py-1.5 ${className}`}>
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={`font-mono text-sm font-semibold tracking-[-0.2pt] ${
          accent ? 'text-indigo-600' : 'text-slate-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function Invoice({ data }: InvoiceProps) {
  const subtotal = sumBy(data.items, (i) => i.qty * i.rate);
  const discounted = subtotal - data.discount;
  const tax = discounted * data.taxRate;
  const total = discounted + tax;

  return (
    <Document title={`Invoice ${data.number}`} author={data.from.name}>
      <Page size="A4" className="flex flex-col bg-white px-16 pb-12 pt-14 font-sans text-slate-900">
        {/* Masthead: issuer identity left, document title + number right. */}
        <div className="flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-2.5">
              <div className="relative h-[18px] w-[18px]">
                <div className="absolute left-0 top-0 h-[13px] w-[13px] rounded-sm bg-indigo-600" />
                <div className="absolute bottom-0 right-0 h-[13px] w-[13px] rounded-sm bg-slate-900" />
              </div>
              <span className="text-lg font-bold tracking-[-0.3pt]">{data.from.name}</span>
            </div>
            <span className="mt-2 text-xs leading-relaxed text-slate-500">{data.from.email}</span>
            <span className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {data.from.address}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <h1 className="text-3xl font-bold leading-none tracking-[-0.8pt]">Invoice</h1>
            <span className="mt-2 font-mono text-sm font-semibold tracking-[0.3pt] text-indigo-600">
              {data.number}
            </span>
          </div>
        </div>

        <div className="my-8 h-px bg-slate-200" />

        {/* Bill-to block beside quiet date/terms columns. */}
        <div className="mb-9 flex flex-row items-start justify-between gap-10">
          <div className="flex flex-col">
            <Eyebrow className="text-indigo-600">Billed to</Eyebrow>
            <p className="mt-2 text-base font-bold tracking-[-0.2pt]">{data.to.name}</p>
            {addressLines(data.to.address).map((line, i) => (
              <p key={i} className="mt-1 text-sm leading-snug text-slate-500">
                {line}
              </p>
            ))}
            <p className="mt-1 text-sm text-slate-400">{data.to.email}</p>
          </div>
          <div className="flex flex-row gap-9 pt-0.5">
            <MetaCol label="Issued" value={data.date} mono />
            <MetaCol label="Due" value={data.dueDate} mono />
            <MetaCol label="Terms" value={data.terms} />
          </div>
        </div>

        {/* Line items - dark header, SKU subtitle under each description. */}
        <Table>
          <Tr className="rounded-md bg-slate-900 px-5">
            <Th flex className="text-xs font-semibold uppercase tracking-[0.8pt] text-white">
              Item
            </Th>
            <Th
              align="right"
              width={44}
              className="text-xs font-semibold uppercase tracking-[0.8pt] text-white"
            >
              Qty
            </Th>
            <Th
              align="right"
              width={92}
              className="text-xs font-semibold uppercase tracking-[0.8pt] text-white"
            >
              Rate
            </Th>
            <Th
              align="right"
              width={104}
              className="text-xs font-semibold uppercase tracking-[0.8pt] text-white"
            >
              Amount
            </Th>
          </Tr>
          {data.items.map((item, i) => (
            <Tr key={i} className="border-b border-slate-100 px-5">
              <Td flex>
                <div className="flex flex-col py-1">
                  <span className="text-sm font-semibold text-slate-900">{item.description}</span>
                  <span className="mt-1 font-mono text-2xs tracking-[0.3pt] text-slate-400">
                    {item.sku}
                  </span>
                </div>
              </Td>
              <Td align="right" width={44} className="font-mono text-sm text-slate-600">
                {item.qty}
              </Td>
              <Td align="right" width={92} className="font-mono text-sm text-slate-600">
                {money(item.rate)}
              </Td>
              <Td
                align="right"
                width={104}
                className="font-mono text-sm font-semibold tracking-[-0.2pt] text-slate-900"
              >
                {money(item.qty * item.rate)}
              </Td>
            </Tr>
          ))}
        </Table>

        {/* Totals stack - discount in the accent, total closed by a strong rule. */}
        <div className="mt-6 flex flex-row justify-end">
          <div className="flex w-[290px] flex-col">
            <SummaryRow label="Subtotal" value={money(subtotal)} />
            <SummaryRow label="Discount" value={`-${money(data.discount)}`} accent />
            <SummaryRow label={`Tax (${(data.taxRate * 100).toFixed(2)}%)`} value={money(tax)} />
            <div className="mt-2.5 flex flex-row items-baseline justify-between border-t-2 border-slate-900 pt-3">
              <span className="text-sm font-bold text-slate-900">Total due</span>
              <span className="font-mono text-xl font-bold tracking-[-0.5pt] text-slate-900">
                {money(total)}
              </span>
            </div>
            <span className="mt-1.5 text-right text-xs text-slate-400">
              Due {data.dueDate} · {data.terms}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Small-print footer. */}
        <div className="mt-10 flex flex-row items-end justify-between border-t border-slate-200 pt-5">
          <div className="flex max-w-[320px] flex-col">
            <p className="text-sm font-semibold text-slate-900">Thank you for your business</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{data.notes}</p>
          </div>
          <p className="text-xs text-slate-400">Questions? {data.from.email}</p>
        </div>
      </Page>
    </Document>
  );
}
