import { Document, Page } from '@imprint-pdf/react';
import { Eyebrow, Pill, Table, Td, Th, Tr } from '../components/index.js';
import { num } from '../lib/format.js';
import type { AnalyticsBar, AnalyticsData } from './sample.js';

export type { AnalyticsBar, AnalyticsData, AnalyticsKpi, AnalyticsRankedPage } from './sample.js';
export { analyticsSample } from './sample.js';

export interface AnalyticsProps {
  data: AnalyticsData;
}

// Charts are built from divs (the node pipeline has no rasteriser, so <Svg src>
// renders the whole page blank). Bar heights are computed at render time, but
// Tailwind only extracts *static* class strings - a dynamic `h-[${px}px]` would
// never be generated. So each computed fraction is snapped to one of a fixed
// ladder of static height classes. The classes below are spelled out literally
// so the extractor can see them.
const BAR_STEPS = [
  'h-[12px]',
  'h-[24px]',
  'h-[36px]',
  'h-[48px]',
  'h-[60px]',
  'h-[72px]',
  'h-[84px]',
  'h-[96px]',
  'h-[108px]',
  'h-[116px]',
] as const;

const SPARK_STEPS = [
  'h-[14px]',
  'h-[21px]',
  'h-[28px]',
  'h-[35px]',
  'h-[42px]',
  'h-[49px]',
  'h-[56px]',
  'h-[63px]',
  'h-[70px]',
] as const;

/** Snap a 0..1 fraction onto a ladder of static height classes. */
function heightClass(fraction: number, steps: readonly string[]): string {
  const clamped = Math.min(1, Math.max(0, fraction));
  const idx = Math.min(steps.length - 1, Math.max(0, Math.round(clamped * (steps.length - 1))));
  return steps[idx] ?? steps[steps.length - 1] ?? '';
}

// Vertical bar chart: each bar is a column whose height is value/max snapped to
// the BAR_STEPS ladder, filled teal (the lead bar a shade darker).
function BarChart({ bars }: { bars: AnalyticsBar[] }) {
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div className="flex flex-col">
      {/* plot area */}
      <div className="flex h-[134px] flex-row items-end justify-between">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end">
            <span className="mb-1.5 font-mono text-2xs font-bold text-slate-900">
              {(b.value / 1000).toFixed(0)}K
            </span>
            <div
              className={`w-[46px] rounded-t-[3px] ${heightClass(b.value / max, BAR_STEPS)} ${
                i === 0 ? 'bg-teal-700' : 'bg-teal-600'
              }`}
            />
          </div>
        ))}
      </div>
      {/* axis */}
      <div className="flex flex-row border-t border-slate-200 pt-2">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-1 items-center justify-center">
            <span className="text-2xs font-medium text-slate-500">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Conversion-rate trend: a row of thin div bars (a divs-only sparkline). Each
// week is scaled between min and max - with an 18% floor so early weeks still
// register - then snapped to the SPARK_STEPS ladder; the latest week reads
// darkest.
function ConversionTrend({ series }: { series: number[] }) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  return (
    <div className="flex flex-row items-stretch gap-5">
      <div className="flex flex-1 flex-col">
        <div className="flex h-[70px] flex-row items-end justify-between gap-1">
          {series.map((v, i) => {
            const last = i === series.length - 1;
            const fraction = 0.18 + ((v - min) / span) * 0.82;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-[2px] ${heightClass(fraction, SPARK_STEPS)} ${
                  last ? 'bg-teal-700' : 'bg-teal-500'
                }`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-row justify-between">
          <span className="font-mono text-2xs text-slate-400">{min.toFixed(2)}%</span>
          <span className="font-mono text-2xs font-bold text-teal-700">{max.toFixed(2)}%</span>
        </div>
      </div>
      {/* current read-out */}
      <div className="flex w-[92px] flex-col justify-center rounded-r border-l-[3px] border-teal-600 bg-slate-50 px-4">
        <Eyebrow className="text-slate-500">Current</Eyebrow>
        <span className="mt-1 font-mono text-xl font-bold tracking-[-0.4pt] text-slate-900">
          {max.toFixed(2)}%
        </span>
        <span className="mt-1 font-mono text-2xs text-slate-400">from {min.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function Analytics({ data }: AnalyticsProps) {
  return (
    <Document title={data.title} author="Growth Team" subject="Analytics dashboard">
      <Page size="A4" className="bg-white px-14 pb-12 pt-0 font-sans text-slate-900">
        {/* Bold header band, full-bleed to the page edges */}
        <div className="-mx-14 mb-6 flex flex-row items-end justify-between bg-slate-900 px-14 pb-6 pt-8">
          <div className="flex flex-col">
            <Eyebrow className="text-teal-200">Growth Report · {data.period}</Eyebrow>
            <h1 className="mt-2 text-4xl font-bold leading-none tracking-[-1pt]">
              <span className="text-white">Growth </span>
              <span className="text-teal-400">Analytics</span>
            </h1>
            <p className="mt-2.5 text-sm text-slate-400">
              Reporting period <span className="font-semibold text-white">{data.period}</span>
            </p>
          </div>
          <div className="flex flex-row items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="text-2xs font-bold uppercase tracking-[1.5pt] text-white">
              Live Snapshot
            </span>
          </div>
        </div>

        {/* KPI card grid - 3 across, 2 rows, stretching the full content width */}
        <div className="mb-6 grid grid-cols-3 gap-2.5 break-inside-avoid">
          {data.kpis.map((kpi, i) => (
            <div
              key={i}
              className="flex flex-col rounded-r border-l-[3px] border-teal-600 bg-slate-50 px-4 py-3"
            >
              <span className="text-2xs font-semibold uppercase tracking-[1.5pt] text-slate-400">
                {kpi.label}
              </span>
              <span className="mt-1.5 font-mono text-xl font-bold tracking-[-0.4pt] text-slate-900">
                {kpi.value}
              </span>
              <div className="mt-1.5 flex flex-row items-center gap-1">
                <div
                  className={`h-1.5 w-1.5 rotate-45 ${kpi.up ? 'bg-emerald-600' : 'bg-rose-600'}`}
                />
                <span
                  className={`font-mono text-xs font-bold ${
                    kpi.up ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {kpi.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Two charts side by side in cards */}
        <div className="mb-6 flex flex-row gap-3.5 break-inside-avoid">
          <div className="flex flex-[1.35] flex-col rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5">
            <span className="mb-3 text-xs font-bold uppercase tracking-[1.5pt] text-teal-700">
              Sessions by channel
            </span>
            <BarChart bars={data.trafficByChannel} />
          </div>
          <div className="flex flex-1 flex-col rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5">
            <div className="mb-3 flex flex-row items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-[1.5pt] text-teal-700">
                Conversion rate trend
              </span>
              <span className="text-2xs font-medium text-slate-400">10 weeks</span>
            </div>
            <div className="flex-1" />
            <ConversionTrend series={data.conversionTrend} />
          </div>
        </div>

        {/* Ranked table */}
        <span className="mb-3 text-xs font-bold uppercase tracking-[1.5pt] text-teal-700">
          Top pages
        </span>
        <Table>
          <Tr className="rounded-t bg-slate-900 px-4">
            <Th width={36}>#</Th>
            <Th flex>Page</Th>
            <Th align="right" width={96}>
              Views
            </Th>
            <Th align="right" width={72}>
              Share
            </Th>
          </Tr>
          {data.topPages.map((p, i) => (
            <Tr
              key={i}
              className={`border-b border-slate-100 px-4 ${
                i % 2 === 1 ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              <Td width={36} cellClassName="py-1.5">
                <span className="font-mono text-sm font-bold text-teal-700">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </Td>
              <Td flex cellClassName="py-1.5">
                <span className="font-mono text-sm font-medium text-slate-900">{p.page}</span>
              </Td>
              <Td align="right" width={96} cellClassName="py-1.5">
                <span className="text-right font-mono text-sm font-bold text-slate-900">
                  {num(p.views)}
                </span>
              </Td>
              <Td align="right" width={72} cellClassName="py-1.5">
                <span className="text-right font-mono text-sm font-semibold text-slate-600">
                  {p.share.toFixed(1)}%
                </span>
              </Td>
            </Tr>
          ))}
        </Table>

        <div className="flex-1" />
        {/* Footer summary strip */}
        <div className="mt-5 flex flex-row items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-2xs uppercase tracking-[1.5pt] text-slate-400">{data.title}</span>
          <div className="flex flex-row items-center gap-2">
            <Pill className="bg-emerald-100 text-emerald-700">5 of 6 KPIs up</Pill>
            <Pill className="bg-rose-100 text-rose-700">Revenue -1.8%</Pill>
          </div>
        </div>
      </Page>
    </Document>
  );
}
