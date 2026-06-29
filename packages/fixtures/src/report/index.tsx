import { Document, Footer, Header, Page, PageNumber, TotalPages } from '@imprint-pdf/react';
import { Table, Td, Th, Tr } from '../components/Table.js';
import { money, num, sumBy } from '../lib/format.js';
import type { ReportData } from './sample.js';

export type { ReportData, ReportKpi, ReportLineItem, ReportMonth } from './sample.js';
export { reportSample } from './sample.js';

export interface ReportProps {
  data: ReportData;
}

export function Report({ data }: ReportProps) {
  const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.value));
  const totalBudget = sumBy(data.lineItems, (i) => i.budget);
  const totalActual = sumBy(data.lineItems, (i) => i.actual);

  return (
    <Document title={data.title} author={data.company} subject="Quarterly financial report">
      <Page size="A4" className="bg-white px-12 py-10 font-sans text-slate-900">
        <Header>
          <div className="flex flex-row justify-between items-center border-b border-slate-200 pb-3 mb-6">
            <span className="text-sm font-bold text-emerald-700">{data.company}</span>
            <span className="text-xs text-slate-400 tracking-[1pt]">{data.title}</span>
          </div>
        </Header>

        <Footer>
          <div className="flex flex-row justify-between items-center border-t border-slate-200 pt-3 mt-6">
            <span className="text-[8pt] text-slate-400 tracking-[1pt]">
              CONFIDENTIAL - INTERNAL USE ONLY
            </span>
            <span className="text-[8pt] text-slate-400">
              Page <PageNumber /> of <TotalPages />
            </span>
          </div>
        </Footer>

        <div className="flex flex-col mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {data.period} - Prepared for the {data.preparedFor}
          </p>
        </div>

        <div className="flex flex-row justify-between mb-10">
          {data.kpis.map((kpi, i) => (
            <div
              key={i}
              className="flex flex-col flex-1 border border-slate-200 rounded-lg px-4 py-3 mr-3 last:mr-0"
            >
              <span className="text-[9pt] text-slate-500 tracking-[0.5pt]">{kpi.label}</span>
              <span className="text-xl font-bold text-slate-900 mt-2">{kpi.value}</span>
              <span
                className={`text-[9pt] font-semibold mt-1 ${kpi.up ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {kpi.delta} vs prior quarter
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col mb-10">
          <span className="text-xs font-bold text-slate-400 tracking-[1pt] mb-3">
            MONTHLY REVENUE ($M)
          </span>
          <div
            className="flex flex-row items-end border-b border-slate-200"
            style={{ height: 160 }}
          >
            {data.revenueByMonth.map((m, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <span className="text-[8pt] font-semibold text-slate-600 mb-1">
                  {m.value.toFixed(2)}
                </span>
                <div
                  className="bg-emerald-500 rounded-t w-10"
                  style={{ height: (m.value / maxRevenue) * 130 }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-row mt-2">
            {data.revenueByMonth.map((m, i) => (
              <span key={i} className="text-[8pt] text-slate-500 text-center flex-1">
                {m.month}
              </span>
            ))}
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400 tracking-[1pt] mb-3">
          BUDGET VS ACTUAL BY ACCOUNT
        </span>
        <Table>
          <Tr className="bg-emerald-700 rounded-t px-4">
            <Th width={50}>Acct</Th>
            <Th flex>Category</Th>
            <Th align="right" width={90}>
              Budget
            </Th>
            <Th align="right" width={90}>
              Actual
            </Th>
            <Th align="right" width={90}>
              Variance
            </Th>
          </Tr>
          {data.lineItems.map((item, i) => {
            const variance = item.actual - item.budget;
            return (
              <Tr key={i} className={`px-4 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
                <Td width={50}>{item.account}</Td>
                <Td flex>{item.category}</Td>
                <Td align="right" width={90}>
                  {money(item.budget)}
                </Td>
                <Td align="right" width={90}>
                  {money(item.actual)}
                </Td>
                <Td align="right" width={90}>
                  <span
                    className={`text-xs text-right ${variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                  >
                    {variance > 0 ? '+' : ''}
                    {num(variance)}
                  </span>
                </Td>
              </Tr>
            );
          })}
          <Tr className="bg-slate-900 rounded-b px-4">
            <Td width={50}>
              <span className="text-xs font-bold text-white" />
            </Td>
            <Td flex>
              <span className="text-xs font-bold text-white">Total</span>
            </Td>
            <Td align="right" width={90}>
              <span className="text-xs font-bold text-white text-right">{money(totalBudget)}</span>
            </Td>
            <Td align="right" width={90}>
              <span className="text-xs font-bold text-white text-right">{money(totalActual)}</span>
            </Td>
            <Td align="right" width={90}>
              <span className="text-xs font-bold text-white text-right">
                {totalActual - totalBudget > 0 ? '+' : ''}
                {num(totalActual - totalBudget)}
              </span>
            </Td>
          </Tr>
        </Table>
      </Page>
    </Document>
  );
}
