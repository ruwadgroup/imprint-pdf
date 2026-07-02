import { Document, Footer, Header, Page, PageNumber, TotalPages } from '@imprint-pdf/react';
import { Eyebrow, Pill } from '../components/index.js';
import { Table, Td, Th, Tr } from '../components/Table.js';
import { money, sumBy } from '../lib/format.js';
import type { BankStatementData } from './sample.js';

export type { BankStatementData, BankTransaction } from './sample.js';
export { bankStatementSample } from './sample.js';

export interface BankStatementProps {
  data: BankStatementData;
}

// Institutional but modern statement of account. One confident accent (teal),
// a full-bleed header band, mono for every money/account/date figure, a dense
// zebra ledger with green credits / slate debits, and four balance KPI cards
// with the closing balance carrying the accent emphasis. Pure Tailwind - the
// accent family is teal (bg-teal-700 / text-teal-700 / border-teal-700).

function Amount({ value, credit }: { value: number | null; credit?: boolean }) {
  if (value == null || value === 0) {
    return <span className="text-right font-mono text-xs text-slate-400">–</span>;
  }
  return (
    <span
      className={`text-right font-mono text-xs font-medium ${
        credit ? 'text-green-700' : 'text-slate-600'
      }`}
    >
      {money(value)}
    </span>
  );
}

export function BankStatement({ data }: BankStatementProps) {
  const totalCredits = sumBy(data.transactions, (t) => t.credit ?? 0);
  const totalDebits = sumBy(data.transactions, (t) => t.debit ?? 0);
  const closingBalance = data.openingBalance + totalCredits - totalDebits;

  let running = data.openingBalance;
  const rows = data.transactions.map((t) => {
    running = running + (t.credit ?? 0) - (t.debit ?? 0);
    return { ...t, balance: running };
  });

  return (
    <Document
      title={`Statement ${data.period}`}
      author={data.bank}
      subject="Monthly bank statement"
    >
      <Page size="A4" className="bg-white px-14 pb-12 pt-12 font-sans text-slate-900">
        {/* Slim running head — secondary page running-head, NOT the masthead.
            The teal band below is the real masthead on page 1; this thin line
            repeats on continuation pages so the ledger always carries context. */}
        <Header>
          <div className="flex flex-row items-center justify-between border-b border-slate-200 px-14 pb-2 pt-4 page-first:hidden">
            <span className="text-2xs font-semibold uppercase tracking-[1.2pt] text-slate-400">
              {data.bank}
            </span>
            <span className="font-mono text-2xs uppercase tracking-[1.2pt] text-slate-400">
              Statement · {data.period}
            </span>
          </div>
        </Header>

        {/* Running footer — masked account + page numbers. */}
        <Footer>
          <div className="flex flex-row items-center justify-between border-t border-slate-200 px-14 pb-4 pt-3">
            <span className="font-mono text-2xs text-slate-400">{data.accountNumberMasked}</span>
            <span className="font-mono text-2xs text-slate-400">
              Page <PageNumber /> / <TotalPages />
            </span>
          </div>
        </Footer>

        {/* Full-bleed teal masthead band bleeding to the page edges. */}
        <div className="-mx-14 flex flex-row items-start justify-between bg-teal-700 px-14 pb-7 pt-7">
          <div className="flex flex-col">
            <div className="mb-2.5 flex flex-row items-center gap-2">
              <div className="relative h-[18px] w-[18px]">
                <div className="absolute left-0 top-0 h-[13px] w-[13px] rounded-sm bg-white" />
                <div className="absolute bottom-0 right-0 h-[13px] w-[13px] rounded-sm bg-teal-900" />
              </div>
              <span className="text-base font-bold tracking-[-0.2pt] text-white">{data.bank}</span>
            </div>
            <h1 className="text-3xl font-bold leading-none tracking-[-1pt] text-white">
              Statement
            </h1>
            <span className="mt-1 text-3xl font-light leading-none tracking-[-1pt] text-white">
              of Account
            </span>
          </div>
          <div className="flex flex-col items-end gap-2 pt-1">
            <span className="text-2xs font-semibold uppercase tracking-[1.5pt] text-teal-100">
              Statement period
            </span>
            <span className="font-mono text-base font-semibold text-white">{data.period}</span>
          </div>
        </div>

        {/* Account-holder + masked-account block with eyebrow. */}
        <div className="mb-7 mt-7 flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <Eyebrow>Account holder</Eyebrow>
            <p className="mt-1.5 text-xl font-bold tracking-[-0.3pt] text-slate-900">
              {data.accountHolder}
            </p>
          </div>
          <div className="flex flex-row gap-9 pt-1">
            <div className="flex flex-col items-end">
              <Eyebrow>Account</Eyebrow>
              <span className="mt-1 font-mono text-sm text-slate-600">
                {data.accountNumberMasked}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <Eyebrow>Routing</Eyebrow>
              <span className="mt-1 font-mono text-sm text-slate-600">{data.routingNumber}</span>
            </div>
          </div>
        </div>

        {/* Four balance cards — closing balance is the accent-filled emphasis. */}
        <div className="mb-8 flex flex-row gap-3">
          <div className="flex flex-1 flex-col rounded-md border border-slate-200 px-3.5 py-3">
            <span className="text-2xs font-semibold uppercase tracking-[1.2pt] text-slate-400">
              Opening balance
            </span>
            <div className="mt-2 flex flex-row items-baseline gap-0.5">
              <span className="font-mono text-xl font-bold tracking-[-0.3pt] text-slate-900">
                {money(data.openingBalance)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-md border border-slate-200 px-3.5 py-3">
            <span className="text-2xs font-semibold uppercase tracking-[1.2pt] text-slate-400">
              Total deposits
            </span>
            <div className="mt-2 flex flex-row items-baseline gap-0.5">
              <span className="font-mono text-base font-bold text-green-700">+</span>
              <span className="font-mono text-xl font-bold tracking-[-0.3pt] text-slate-900">
                {money(totalCredits)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-md border border-slate-200 px-3.5 py-3">
            <span className="text-2xs font-semibold uppercase tracking-[1.2pt] text-slate-400">
              Total withdrawals
            </span>
            <div className="mt-2 flex flex-row items-baseline gap-0.5">
              <span className="font-mono text-base font-bold text-slate-600">-</span>
              <span className="font-mono text-xl font-bold tracking-[-0.3pt] text-slate-900">
                {money(totalDebits)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-md bg-teal-700 px-3.5 py-3">
            <span className="text-2xs font-semibold uppercase tracking-[1.2pt] text-teal-100">
              Closing balance
            </span>
            <div className="mt-2 flex flex-row items-baseline gap-0.5">
              <span className="font-mono text-xl font-bold tracking-[-0.3pt] text-white">
                {money(closingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Section eyebrow + count pill. */}
        <div className="mb-2.5 flex flex-row items-center gap-2">
          <Eyebrow className="text-slate-500">Transaction detail</Eyebrow>
          <Pill className="bg-teal-100 text-teal-700">{`${data.transactions.length} ITEMS`}</Pill>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Dense ledger: dark header, zebra rows, right-aligned mono figures. */}
        <Table>
          <Tr className="rounded-t bg-teal-900 px-4">
            <Th width={50}>Date</Th>
            <Th flex>Description</Th>
            <Th align="right" width={78}>
              Debit
            </Th>
            <Th align="right" width={78}>
              Credit
            </Th>
            <Th align="right" width={92}>
              Balance
            </Th>
          </Tr>
          {rows.map((t, i) => (
            <Tr
              key={i}
              className={`border-b border-slate-200 px-4 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}
            >
              <Td width={50} className="font-mono text-xs text-slate-500">
                {t.date}
              </Td>
              <Td flex className="text-sm font-medium text-slate-900">
                {t.description}
              </Td>
              <Td align="right" width={78}>
                <Amount value={t.debit ?? null} />
              </Td>
              <Td align="right" width={78}>
                <Amount value={t.credit ?? null} credit />
              </Td>
              <Td align="right" width={92}>
                <span className="text-right font-mono text-xs font-semibold text-slate-900">
                  {money(t.balance)}
                </span>
              </Td>
            </Tr>
          ))}
          {/* Closing summary row. */}
          <Tr className="rounded-b bg-teal-100 px-4">
            <Td width={50}>
              <span />
            </Td>
            <Td flex>
              <span className="text-2xs font-bold uppercase tracking-[1.2pt] text-teal-900">
                Closing balance
              </span>
            </Td>
            <Td align="right" width={78}>
              <span className="text-right font-mono text-xs font-semibold text-slate-600">
                {money(totalDebits)}
              </span>
            </Td>
            <Td align="right" width={78}>
              <span className="text-right font-mono text-xs font-semibold text-green-700">
                {money(totalCredits)}
              </span>
            </Td>
            <Td align="right" width={92}>
              <span className="text-right font-mono text-sm font-bold text-teal-900">
                {money(closingBalance)}
              </span>
            </Td>
          </Tr>
        </Table>

        <p className="mt-5 text-2xs leading-relaxed text-slate-400">
          This statement is provided for informational purposes. Please review all transactions and
          report any discrepancies within 60 days of the statement date.
        </p>
      </Page>
    </Document>
  );
}
