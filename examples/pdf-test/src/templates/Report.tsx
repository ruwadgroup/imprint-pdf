import { Bookmark, Document, Page } from '@imprint/react';
import type { ReportData } from '../data/report.js';

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtK(n: number) {
  return `$${Math.round(n / 1_000)}K`;
}

function RevenueChart({
  months,
  maxAxis = 600_000,
}: {
  months: ReportData['revenue'];
  maxAxis?: number;
}) {
  const MAX_BAR_H = 130;
  const ROW_H = MAX_BAR_H + 20;

  return (
    <div className="bg-slate-50 p-5 rounded-lg">
      <div className="flex flex-row items-end gap-2" style={{ height: ROW_H }}>
        {months.map((m, i) => {
          const barH = Math.round((m.current / maxAxis) * MAX_BAR_H);
          const isQ1 = i >= 3;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span
                className={`font-bold text-center mb-1 text-[6.5pt] ${isQ1 ? 'text-[#4f46e5]' : 'text-[#94a3b8]'}`}
              >
                {fmtK(m.current)}
              </span>
              <div
                className={`w-full rounded-sm ${isQ1 ? 'bg-[#4f46e5]' : 'bg-[#c7d2fe]'}`}
                style={{ height: barH }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex flex-row gap-2 mt-1.5 pt-1.5 border-t border-slate-200">
        {months.map((m, i) => (
          <div key={i} className="flex-1 items-center">
            <span className="text-center text-slate-400 text-[6.5pt]">{m.month}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-row justify-end gap-4 mt-3">
        {[
          { color: '#c7d2fe', label: 'Q4 2024 (context)' },
          { color: '#4f46e5', label: 'Q1 2025' },
        ].map((entry, i) => (
          <div key={i} className="flex flex-row items-center gap-1.5">
            <div className="rounded-sm w-[10pt] h-[6pt]" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400 text-[7pt]">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthTable({ months }: { months: ReportData['revenue'] }) {
  return (
    <table className="mt-5">
      <thead>
        <tr className="flex flex-row items-center bg-slate-900 py-2 px-3 rounded-md">
          <th className="flex-1 text-xs font-bold text-white tracking-[0.8pt] text-left">MONTH</th>
          <th className="w-[80pt] text-xs font-bold text-white tracking-[0.8pt] text-right">
            REVENUE
          </th>
          <th className="w-[80pt] text-xs font-bold text-white tracking-[0.8pt] text-right">
            PRIOR PERIOD
          </th>
          <th className="w-[64pt] text-xs font-bold text-white tracking-[0.8pt] text-right">
            GROWTH
          </th>
        </tr>
      </thead>
      <tbody>
        {months.map((m, i) => {
          const growth = ((m.current - m.prior) / m.prior) * 100;
          const pos = growth >= 0;
          return (
            <tr
              key={i}
              className={`flex flex-row items-center py-2 px-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
            >
              <td className="flex-1 text-xs font-semibold text-slate-900">{m.month}</td>
              <td className="w-[80pt] text-xs font-bold text-slate-900 text-right">
                {fmtUSD(m.current)}
              </td>
              <td className="w-[80pt] text-xs text-slate-500 text-right">{fmtUSD(m.prior)}</td>
              <td
                className={`w-[64pt] text-xs font-bold text-right ${pos ? 'text-[#059669]' : 'text-[#dc2626]'}`}
              >
                {`${pos ? '+' : ''}${growth.toFixed(1)}%`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Report({ data }: { data: ReportData }) {
  const TOTAL_PAGES = 4;
  const pageHeader = (title: string, page: number) => (
    <div className="flex flex-row items-center mb-7 pb-2.5 border-b-[1.5pt] border-b-[#4f46e5]">
      <div className="flex-1">
        <span className="text-xs font-bold tracking-widest text-[#4f46e5]">{title}</span>
      </div>
      <span className="text-xs text-slate-400">{`Q1 2025 Performance Report  ·  ${page} / ${TOTAL_PAGES}`}</span>
    </div>
  );

  return (
    <Document title={`${data.client} — Q1 2025 Performance Report`} author={data.company}>
      {/* Cover page */}
      <Page size="A4" style={{ backgroundColor: '#0f172a', fontFamily: 'Outfit' }}>
        <div className="absolute top-[56pt] left-[56pt] right-[56pt]">
          <span className="text-xs font-bold text-[#818cf8] tracking-[3pt]">
            {data.company.toUpperCase()}
          </span>
        </div>

        <div className="absolute top-[46pt] right-[56pt] w-[22pt] h-[22pt] bg-[#4f46e5]" />
        <div className="absolute top-[58pt] right-[72pt] w-[10pt] h-[10pt] bg-[#06b6d4]" />

        <div className="absolute top-[280pt] left-[56pt] right-[56pt]">
          <span className="text-sm text-slate-500 mb-5 tracking-[7pt]">Q1 · 2025</span>
          <h1 className="text-white font-bold text-[54pt] leading-[1.05] tracking-[-1pt]">
            PERFORMANCE
          </h1>
          <h1 className="text-white mb-11 text-[54pt] font-light leading-[1.05] tracking-[-1pt]">
            REPORT
          </h1>
          <div className="mb-1 h-[3pt] bg-[#4f46e5]" />
          <div className="mb-11 h-[1.5pt] bg-[#06b6d4]" />
          <span className="text-xs text-slate-500 mb-2.5 tracking-[4pt]">PREPARED FOR</span>
          <h2 className="text-white font-bold mb-1.5 text-[22pt]">{data.client}</h2>
          <p className="text-sm text-slate-500">{`${data.period}  ·  Issued ${data.issuedDate}`}</p>
        </div>

        <div className="absolute flex flex-row justify-between bottom-[48pt] left-[56pt] right-[56pt]">
          <span className="text-xs text-slate-700">
            Confidential — Not for External Distribution
          </span>
          <span className="text-xs text-slate-700">{data.issuedDate}</span>
        </div>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" className="bg-white px-14 py-12" style={{ fontFamily: 'Outfit' }}>
        <Bookmark title="Executive Summary" level={1}>
          {pageHeader('EXECUTIVE SUMMARY', 2)}

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Executive Summary</h2>
          <p className="text-xs text-slate-400 mb-6">Fiscal Q1 2025 · January 1 – March 31, 2025</p>

          <p className="text-sm text-slate-600 mb-7 leading-relaxed">
            Imprint Studio delivered its strongest opening quarter on record, achieving $1.47M in
            revenue — a 14.1% year-over-year increase — while maintaining a healthy operating margin
            of 31.1%. Two new enterprise accounts were secured in March, and the product team
            shipped the v1.4 rendering engine upgrade that reduced average PDF generation time by
            38%.
          </p>

          {[data.kpis.slice(0, 2), data.kpis.slice(2, 4)].map((row, ri) => (
            <div key={ri} className={`flex flex-row gap-3.5 ${ri === 0 ? 'mb-3.5' : 'mb-8'}`}>
              {row.map((k, i) => (
                <div
                  key={i}
                  className={`flex-1 bg-slate-50 p-4 rounded-md border-l-[3pt] ${k.positive ? 'border-l-[#059669]' : 'border-l-[#dc2626]'}`}
                >
                  <span className="text-xs text-slate-400 uppercase mb-2 tracking-[1.2pt]">
                    {k.label}
                  </span>
                  <p className="font-bold text-slate-900 mb-2 text-[26pt] leading-none">
                    {k.value}
                  </p>
                  <div className="flex flex-row items-center gap-1.5">
                    <div
                      className={`px-1.5 py-0.5 rounded ${k.positive ? 'bg-[#d1fae5]' : 'bg-[#fee2e2]'}`}
                    >
                      <span
                        className={`text-xs font-bold ${k.positive ? 'text-[#059669]' : 'text-[#dc2626]'}`}
                      >
                        {k.change}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <h3 className="text-sm font-bold text-slate-900 mb-3">Quarter Highlights</h3>
          <ul>
            {data.highlights.map((h, i) => (
              <li key={i} className="flex flex-row mb-2.5 gap-2.5">
                <div className="rounded-full mt-1 w-[6pt] h-[6pt] bg-[#4f46e5] shrink-0" />
                <p className="flex-1 text-xs text-slate-600 leading-relaxed">{h}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-4 rounded-md bg-[#eef2ff] border-l-[3pt] border-l-[#4f46e5]">
            <span className="text-xs font-bold mb-2 text-[#4f46e5] tracking-[1.5pt]">
              Q2 2025 OUTLOOK
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{data.outlook}</p>
          </div>
        </Bookmark>
      </Page>

      {/* Revenue Analysis */}
      <Page size="A4" className="bg-white px-14 py-12" style={{ fontFamily: 'Outfit' }}>
        <Bookmark title="Revenue Analysis" level={1}>
          {pageHeader('REVENUE ANALYSIS', 3)}
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Revenue Analysis</h2>
          <p className="text-xs text-slate-400 mb-6">
            Monthly revenue — Q4 2024 context vs Q1 2025 (Oct 2024 – Mar 2025)
          </p>
          <RevenueChart months={data.revenue} maxAxis={600_000} />
          <MonthTable months={data.revenue} />
        </Bookmark>
      </Page>

      {/* Operations & Team */}
      <Page size="A4" className="bg-white px-14 py-12" style={{ fontFamily: 'Outfit' }}>
        <Bookmark title="Operations & Team" level={1}>
          {pageHeader('OPERATIONS & TEAM', 4)}

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Expense Breakdown</h2>
          <p className="text-xs text-slate-400 mb-6">Q1 2025 operating expenses — total $1.017M</p>

          <div className="mb-8">
            {data.expenses.map((e, i) => (
              <div key={i} className="flex flex-row items-center mb-3 gap-3">
                <div className="w-[130pt]">
                  <span className="text-xs font-semibold text-slate-900">{e.category}</span>
                </div>
                <div className="flex-1 bg-slate-200 rounded-full h-[8pt]">
                  <div
                    className="rounded-full h-[8pt]"
                    style={{ width: `${e.pct}%`, backgroundColor: e.color }}
                  />
                </div>
                <div className="w-[36pt]">
                  <span className="text-xs text-slate-500 text-right">{`${e.pct}%`}</span>
                </div>
                <div className="w-[68pt]">
                  <span className="text-xs font-bold text-slate-900 text-right">
                    {fmtUSD(e.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 mb-7" />

          <h2 className="text-xl font-bold text-slate-900 mb-1">Team Overview</h2>
          <p className="text-xs text-slate-400 mb-4">Key personnel — Q1 2025</p>

          <table>
            <thead>
              <tr className="flex flex-row items-center bg-slate-900 py-2 px-3 rounded-md mb-px">
                <th className="w-[148pt] text-xs font-bold text-white tracking-[0.8pt] text-left">
                  NAME
                </th>
                <th className="flex-1 text-xs font-bold text-white tracking-[0.8pt] text-left">
                  ROLE
                </th>
                <th className="w-[90pt] text-xs font-bold text-white tracking-[0.8pt] text-left">
                  DEPARTMENT
                </th>
              </tr>
            </thead>
            <tbody>
              {data.team.map((member, i) => (
                <tr
                  key={i}
                  className={`flex flex-row items-center py-2 px-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <td className="w-[148pt] text-xs font-bold text-slate-900">{member.name}</td>
                  <td className="flex-1 text-xs text-slate-600">{member.role}</td>
                  <td className="w-[90pt] text-xs text-slate-400">{member.dept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Bookmark>

        <div className="absolute flex flex-row justify-between items-center bottom-[44pt] left-[56pt] right-[56pt]">
          <span className="text-xs text-slate-400">{`Generated by Imprint  ·  ${data.company}`}</span>
          <a href="https://imprint.dev">
            <span className="text-xs text-[#4f46e5]">imprint.dev</span>
          </a>
        </div>
      </Page>
    </Document>
  );
}
