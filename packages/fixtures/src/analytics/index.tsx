import { Document, Page } from '@imprint-pdf/react';
import { Table, Td, Th, Tr } from '../components/Table.js';
import { num } from '../lib/format.js';
import type { AnalyticsBar, AnalyticsData } from './sample.js';

export type { AnalyticsBar, AnalyticsData, AnalyticsKpi, AnalyticsRankedPage } from './sample.js';
export { analyticsSample } from './sample.js';

export interface AnalyticsProps {
  data: AnalyticsData;
}

const BAR_MAX_H = 150;
const SPARK_MAX_H = 60;

function BarChart({ bars }: { bars: AnalyticsBar[] }) {
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div
      className="flex flex-row items-end justify-between border-b border-slate-200 pb-1"
      style={{ height: BAR_MAX_H + 40 }}
    >
      {bars.map((b, i) => (
        <div key={i} className="flex flex-col items-center justify-end flex-1">
          <span className="text-[10pt] font-bold text-slate-700 mb-1">
            {(b.value / 1000).toFixed(0)}K
          </span>
          <div
            className="bg-indigo-500 rounded-t"
            style={{ width: 36, height: (b.value / max) * BAR_MAX_H }}
          />
          <span className="text-[10pt] text-slate-500 mt-1">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ series }: { series: number[] }) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  return (
    <div className="flex flex-row items-center">
      <span className="text-[10pt] text-slate-500 mr-3" style={{ width: 40 }}>
        {min.toFixed(1)}%
      </span>
      <div className="flex flex-row items-end flex-1" style={{ height: SPARK_MAX_H }}>
        {series.map((v, i) => (
          <div
            key={i}
            className="bg-emerald-500 rounded-t mr-1"
            style={{ width: 6, height: 8 + ((v - min) / span) * SPARK_MAX_H }}
          />
        ))}
      </div>
      <span
        className="text-[10pt] font-bold text-emerald-600 ml-3 text-right"
        style={{ width: 48 }}
      >
        {max.toFixed(2)}%
      </span>
    </div>
  );
}

export function Analytics({ data }: AnalyticsProps) {
  return (
    <Document title={data.title} author="Growth Team" subject="Analytics dashboard">
      <Page size="A4" className="bg-white px-12 py-10 font-sans text-slate-900">
        <div className="flex flex-row justify-between items-end mb-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
            <p className="text-xs text-slate-500 mt-1">Reporting period {data.period}</p>
          </div>
          <span className="text-[9pt] font-semibold text-indigo-600 tracking-[1pt]">
            LIVE SNAPSHOT
          </span>
        </div>

        <div className="flex flex-row flex-wrap mb-8">
          {data.kpis.map((kpi, i) => (
            <div
              key={i}
              className="flex flex-col border border-slate-200 rounded-lg px-4 py-3 mb-3"
              style={{ width: 160, marginRight: i % 3 === 2 ? 0 : 12 }}
            >
              <span className="text-[9pt] text-slate-500">{kpi.label}</span>
              <span className="text-xl font-bold text-slate-900 mt-1">{kpi.value}</span>
              <span
                className={`text-[9pt] font-semibold mt-1 ${kpi.up ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {kpi.delta}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col mb-8">
          <span className="text-xs font-bold text-slate-400 tracking-[1pt] mb-2">
            SESSIONS BY CHANNEL
          </span>
          <BarChart bars={data.trafficByChannel} />
        </div>

        <div className="flex flex-col mb-8">
          <span className="text-xs font-bold text-slate-400 tracking-[1pt] mb-2">
            CONVERSION RATE TREND
          </span>
          <Sparkline series={data.conversionTrend} />
        </div>

        <span className="text-xs font-bold text-slate-400 tracking-[1pt] mb-2">TOP PAGES</span>
        <Table>
          <Tr className="bg-indigo-600 rounded-t px-4">
            <Th width={36}>#</Th>
            <Th flex>Page</Th>
            <Th align="right" width={90}>
              Views
            </Th>
            <Th align="right" width={80}>
              Share
            </Th>
          </Tr>
          {data.topPages.map((p, i) => (
            <Tr key={i} className={`px-4 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
              <Td width={36}>
                <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
              </Td>
              <Td flex>
                <span className="text-xs font-mono text-slate-700">{p.page}</span>
              </Td>
              <Td align="right" width={90}>
                {num(p.views)}
              </Td>
              <Td align="right" width={80}>
                <span className="text-xs text-right font-semibold text-slate-900">{p.share}%</span>
              </Td>
            </Tr>
          ))}
        </Table>
      </Page>
    </Document>
  );
}
