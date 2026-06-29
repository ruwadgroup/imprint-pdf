import { Document, Footer, Header, Page, PageNumber, TotalPages } from '@imprint-pdf/react';
import { Eyebrow, Pill, Table, Td, Th, Tr } from '../components/index.js';
import { money, num, sumBy } from '../lib/format.js';
import type { ReportData } from './sample.js';

export type { ReportData, ReportKpi, ReportLineItem, ReportMonth } from './sample.js';
export { reportSample } from './sample.js';

export interface ReportProps {
  data: ReportData;
}

// Bold, modern financial report. Dark full-bleed cover, then content pages with a
// running header/footer, KPI cards, a div-based revenue chart and a budget ledger.
// Accent family: blue (primary) + emerald (secondary). Pure Tailwind, no inline styles.

function RunningHeader({ data }: { data: ReportData }) {
  return (
    <Header>
      <div className="mb-8 flex flex-row items-center justify-between border-b-[1.5px] border-blue-600 pb-2.5 font-sans">
        <span className="text-2xs font-bold uppercase tracking-[2pt] text-blue-600">
          {data.company}
        </span>
        <span className="text-2xs uppercase tracking-[1.5pt] text-slate-400">{data.title}</span>
      </div>
    </Header>
  );
}

function RunningFooter() {
  return (
    <Footer>
      <div className="mt-6 flex flex-row items-center justify-between border-t border-slate-200 pt-2.5 font-sans">
        <span className="text-2xs uppercase tracking-[1.5pt] text-slate-400">
          Confidential - Internal use only
        </span>
        <span className="font-mono text-2xs text-slate-500">
          Page <PageNumber /> of <TotalPages />
        </span>
      </div>
    </Footer>
  );
}

function LedgerHeader() {
  return (
    <Tr className="rounded-t bg-blue-600 px-4">
      <Th width={44}>Acct</Th>
      <Th flex>Category</Th>
      <Th align="right" width={88}>
        Budget
      </Th>
      <Th align="right" width={88}>
        Actual
      </Th>
      <Th align="right" width={84}>
        Variance
      </Th>
    </Tr>
  );
}

function LedgerRow({ item, index }: { item: ReportData['lineItems'][number]; index: number }) {
  const variance = item.actual - item.budget;
  const over = variance > 0;
  return (
    <Tr
      className={`border-b border-slate-100 px-4 ${index % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}
    >
      <Td width={44} cellClassName="py-1.5" className="font-mono text-xs text-slate-400">
        {item.account}
      </Td>
      <Td flex cellClassName="py-1.5" className="text-xs text-slate-900">
        {item.category}
      </Td>
      <Td
        align="right"
        width={88}
        cellClassName="py-1.5"
        className="font-mono text-xs text-slate-500"
      >
        {money(item.budget)}
      </Td>
      <Td
        align="right"
        width={88}
        cellClassName="py-1.5"
        className="font-mono text-xs font-medium text-slate-900"
      >
        {money(item.actual)}
      </Td>
      <Td align="right" width={84} cellClassName="py-1.5">
        <span
          className={`text-right font-mono text-xs font-bold ${
            over ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          {over ? '+' : ''}
          {num(variance)}
        </span>
      </Td>
    </Tr>
  );
}

export function Report({ data }: ReportProps) {
  const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.value));
  const totalBudget = sumBy(data.lineItems, (i) => i.budget);
  const totalActual = sumBy(data.lineItems, (i) => i.actual);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePct = totalBudget ? (totalVariance / totalBudget) * 100 : 0;
  const netOver = totalVariance > 0;

  const issued = data.period.split(' - ')[1] ?? data.period;

  // Split the ledger across pages so nothing overflows an A4 page. The first
  // ledger page carries the section head + summary strip, so it holds fewer rows;
  // the remainder (with the totals row) flows onto a second ledger page.
  const FIRST_PAGE_ROWS = 18;
  const ledgerHead = data.lineItems.slice(0, FIRST_PAGE_ROWS);
  const ledgerTail = data.lineItems.slice(FIRST_PAGE_ROWS);

  return (
    <Document title={data.title} author={data.company} subject="Quarterly financial report">
      {/* ── Page 1 · Dark full-bleed cover ───────────────────────────── */}
      <Page size="A4" className="flex flex-col bg-[#0a1226] px-16 pb-14 pt-14 font-sans">
        {/* Brand row */}
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <div className="relative h-[18px] w-[18px]">
              <div className="absolute left-0 top-0 h-[13px] w-[13px] rounded-sm bg-blue-600" />
              <div className="absolute bottom-0 right-0 h-[13px] w-[13px] rounded-sm bg-[#1b2944]" />
            </div>
            <span className="text-base font-bold tracking-[-0.2pt] text-white">{data.company}</span>
          </div>
          <span className="text-2xs uppercase tracking-[2pt] text-slate-500">
            {data.preparedFor}
          </span>
        </div>

        <div className="flex-1" />

        {/* Display title block */}
        <span className="text-sm uppercase tracking-[3pt] text-blue-500">
          {data.period.split(' - ')[0]?.trim().slice(0, 12) ?? ''} · {issued.slice(-4)}
        </span>
        <h1 className="mt-3 text-5xl font-bold leading-[1.02] tracking-[-1.5pt] text-white">
          PERFORMANCE
        </h1>
        <h1 className="text-5xl font-light leading-[1.02] tracking-[-1.5pt] text-slate-300">
          REPORT
        </h1>

        {/* Accent rule */}
        <div className="mt-7 flex flex-row items-center">
          <div className="h-1 w-16 bg-blue-600" />
          <div className="h-0.5 flex-1 bg-emerald-600 opacity-70" />
        </div>

        {/* Prepared-for block */}
        <div className="mt-8 flex flex-col">
          <span className="text-2xs uppercase tracking-[2.5pt] text-slate-500">Prepared for</span>
          <span className="mt-2 text-2xl font-bold tracking-[-0.4pt] text-white">
            {data.preparedFor}
          </span>
          <span className="mt-1.5 font-mono text-sm text-slate-300">
            {data.period} · Issued {issued}
          </span>
        </div>

        <div className="flex-1" />

        {/* Confidential footer line */}
        <div className="flex flex-row items-center justify-between border-t border-[#1b2944] pt-4">
          <span className="text-2xs uppercase tracking-[1.5pt] text-slate-500">
            Confidential - Not for external distribution
          </span>
          <span className="font-mono text-2xs text-slate-500">{data.title}</span>
        </div>
      </Page>

      {/* ── Page 2 · Executive summary, KPIs, chart, outlook ─────────── */}
      <Page size="A4" className="bg-white px-14 pb-12 pt-9 font-sans text-slate-900">
        <RunningHeader data={data} />
        <RunningFooter />

        {/* Section head */}
        <div className="mb-7 flex flex-col">
          <Eyebrow className="text-blue-600">Section 01</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.6pt] text-[#0b1220]">
            Executive Summary
          </h2>
          <p className="mt-1.5 font-mono text-sm text-slate-500">
            {data.title} · {data.period}
          </p>
        </div>

        <p className="mb-8 max-w-[470px] text-sm leading-relaxed text-slate-700">
          {data.company} closed the quarter ahead of plan, posting {data.kpis[0]?.value ?? ''} in
          total revenue on the strength of broad-based demand across product lines. Margins expanded
          against the prior quarter while operating discipline held cost growth below the top line,
          leaving the business well capitalized heading into the next period.
        </p>

        {/* KPI grid - two rows of two */}
        <div className="mb-3 flex flex-row gap-3">
          {data.kpis.slice(0, 2).map((kpi, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col rounded-r border-l-[3px] bg-slate-50 px-4 py-3.5 ${
                i === 0 ? 'border-blue-600' : 'border-emerald-600'
              }`}
            >
              <span className="text-2xs font-semibold uppercase tracking-[1.5pt] text-slate-400">
                {kpi.label}
              </span>
              <span className="mt-1.5 font-mono text-2xl font-bold tracking-[-0.5pt] text-[#0b1220]">
                {kpi.value}
              </span>
              <div className="mt-1.5 flex flex-row items-center gap-1.5">
                <span
                  className={`text-xs font-bold ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {kpi.delta}
                </span>
                <span className="text-2xs text-slate-400">vs prior quarter</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-9 flex flex-row gap-3">
          {data.kpis.slice(2, 4).map((kpi, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col rounded-r border-l-[3px] bg-slate-50 px-4 py-3.5 ${
                i === 0 ? 'border-blue-600' : 'border-emerald-600'
              }`}
            >
              <span className="text-2xs font-semibold uppercase tracking-[1.5pt] text-slate-400">
                {kpi.label}
              </span>
              <span className="mt-1.5 font-mono text-2xl font-bold tracking-[-0.5pt] text-[#0b1220]">
                {kpi.value}
              </span>
              <div className="mt-1.5 flex flex-row items-center gap-1.5">
                <span
                  className={`text-xs font-bold ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {kpi.delta}
                </span>
                <span className="text-2xs text-slate-400">vs prior quarter</span>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue bar chart (divs) */}
        <div className="mb-2 flex flex-row items-center gap-2.5">
          <div className="h-3.5 w-1 rounded-sm bg-blue-600" />
          <span className="text-sm font-bold uppercase tracking-[1pt] text-[#0b1220]">
            Monthly Revenue
          </span>
        </div>
        <div className="mb-2 flex flex-row items-baseline justify-between">
          <Eyebrow className="text-slate-500">Trailing six months</Eyebrow>
          <Eyebrow className="text-slate-400">USD Millions</Eyebrow>
        </div>
        <div className="flex h-[158px] flex-row items-end border-b border-slate-200 pt-3">
          {data.revenueByMonth.map((m, i) => {
            const last = i === data.revenueByMonth.length - 1;
            const barH = Math.round(Math.max(6, (m.value / maxRevenue) * 116));
            return (
              <div key={i} className="flex flex-1 flex-col items-center">
                <span
                  className={`mb-2 font-mono text-2xs font-semibold ${
                    last ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  {m.value.toFixed(2)}
                </span>
                <div
                  className={`w-9 rounded-t-sm ${last ? 'bg-blue-600' : 'bg-blue-200'} h-[${barH}px]`}
                />
              </div>
            );
          })}
        </div>
        <div className="mb-9 mt-2 flex flex-row">
          {data.revenueByMonth.map((m, i) => (
            <span
              key={i}
              className="flex-1 text-center text-2xs uppercase tracking-[1pt] text-slate-400"
            >
              {m.month}
            </span>
          ))}
        </div>

        <div className="flex-1" />

        {/* Outlook callout */}
        <div className="flex flex-row items-stretch gap-3 rounded-md bg-blue-50 px-4 py-3">
          <div className="w-[3px] rounded-sm bg-blue-600" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-[1.5pt] text-blue-600">
              Outlook · Next Quarter
            </span>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Pipeline coverage and a healthy cash position support continued growth into the coming
              quarter. Management guidance holds revenue expansion in the low double digits, with
              margin gains reinvested into product development and select market expansion.
            </p>
          </div>
        </div>
      </Page>

      {/* ── Page 3 · Budget vs Actual ledger ─────────────────────────── */}
      <Page size="A4" className="bg-white px-14 pb-12 pt-9 font-sans text-slate-900">
        <RunningHeader data={data} />
        <RunningFooter />

        <div className="mb-7 flex flex-col">
          <Eyebrow className="text-blue-600">Section 02</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.6pt] text-[#0b1220]">
            Budget vs Actual
          </h2>
          <p className="mt-1.5 font-mono text-sm text-slate-500">By account · All figures USD</p>
        </div>

        {/* Variance summary strip */}
        <div className="mb-6 flex flex-row items-center justify-between rounded-md bg-slate-50 px-4 py-3">
          <div className="flex flex-row gap-8">
            <div className="flex flex-col">
              <Eyebrow className="text-slate-500">Total budget</Eyebrow>
              <span className="mt-1 font-mono text-base font-bold text-[#0b1220]">
                {money(totalBudget)}
              </span>
            </div>
            <div className="flex flex-col">
              <Eyebrow className="text-slate-500">Total actual</Eyebrow>
              <span className="mt-1 font-mono text-base font-bold text-[#0b1220]">
                {money(totalActual)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Eyebrow className="text-slate-500">Net variance</Eyebrow>
            <div className="mt-1 flex flex-row items-center gap-2">
              <span
                className={`font-mono text-base font-bold ${
                  netOver ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {netOver ? '+' : ''}
                {num(totalVariance)}
              </span>
              <Pill
                className={netOver ? 'bg-red-100 text-red-600' : 'bg-green-100 text-emerald-600'}
              >
                {totalVariancePct > 0 ? '+' : ''}
                {totalVariancePct.toFixed(1)}%
              </Pill>
            </div>
          </div>
        </div>

        <Table>
          <LedgerHeader />
          {ledgerHead.map((item, i) => (
            <LedgerRow key={i} item={item} index={i} />
          ))}
        </Table>
      </Page>

      {/* ── Page 4 · Ledger continued + totals ───────────────────────── */}
      <Page size="A4" className="bg-white px-14 pb-12 pt-9 font-sans text-slate-900">
        <RunningHeader data={data} />
        <RunningFooter />

        <div className="mb-7 flex flex-col">
          <Eyebrow className="text-blue-600">Section 02 · continued</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.6pt] text-[#0b1220]">
            Budget vs Actual
          </h2>
          <p className="mt-1.5 font-mono text-sm text-slate-500">By account · All figures USD</p>
        </div>

        <Table>
          <LedgerHeader />
          {ledgerTail.map((item, i) => (
            <LedgerRow key={i} item={item} index={FIRST_PAGE_ROWS + i} />
          ))}
          <Tr className="rounded-b bg-[#0b1220] px-4">
            <Td width={44}>
              <span />
            </Td>
            <Td flex>
              <span className="text-xs font-bold uppercase tracking-[1.5pt] text-white">Total</span>
            </Td>
            <Td align="right" width={88}>
              <span className="text-right font-mono text-xs font-bold text-white">
                {money(totalBudget)}
              </span>
            </Td>
            <Td align="right" width={88}>
              <span className="text-right font-mono text-xs font-bold text-white">
                {money(totalActual)}
              </span>
            </Td>
            <Td align="right" width={84}>
              <span
                className={`text-right font-mono text-xs font-bold ${
                  netOver ? 'text-red-300' : 'text-emerald-300'
                }`}
              >
                {netOver ? '+' : ''}
                {num(totalVariance)}
              </span>
            </Td>
          </Tr>
        </Table>

        <div className="flex-1" />

        <div className="flex flex-row items-stretch gap-3 rounded-md bg-emerald-50 px-4 py-3">
          <div className="w-[3px] rounded-sm bg-emerald-600" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-[1.5pt] text-emerald-600">
              Notes
            </span>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Variances reflect actuals against the approved operating budget for the period.
              Figures are unaudited and subject to standard quarter-end adjustments. Accounts
              showing material variance are reviewed with department leads ahead of the next
              planning cycle.
            </p>
          </div>
        </div>
      </Page>
    </Document>
  );
}
