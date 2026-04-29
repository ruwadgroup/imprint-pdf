# Cookbook — Financial report (multi-page)

A multi-page financial report with a cover page, running headers, a data table,
and vector charts.

## What you'll build

- Cover page with company logo and report period
- Auto-paged content with running headers and page numbers
- A revenue table with conditional row styling
- A `<Chart>` (Recharts BarChart) rendered as PDF vectors
- Section headings that stay with their following content (`break-after-avoid`)

## Template sketch

```tsx
// src/templates/Report.tsx
import { Document, Page, View, Chart, PageNumber, TotalPages } from '@imprint/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ReportProps {
  report: {
    company: string;
    period: string;
    quarters: Array<{ label: string; revenue: number; expenses: number }>;
    sections: Array<{ heading: string; body: string; table?: TableData }>;
  };
}

function Header({ company, period }: { company: string; period: string }) {
  return (
    <View className="absolute top-0 inset-x-0 h-12 flex items-center px-12 border-b border-gray-100">
      <span className="text-xs font-medium text-gray-500">{company} — {period}</span>
      <span className="ml-auto text-xs text-gray-400">
        <PageNumber /> / <TotalPages />
      </span>
    </View>
  );
}

export function Report({ report }: ReportProps) {
  return (
    <Document title={`${report.company} — ${report.period}`} lang="en">

      {/* Cover */}
      <Page size="A4" className="relative p-12 font-sans bg-[#0F172A] text-white">
        <View className="flex flex-col h-full justify-end">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            Financial Report
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{report.company}</h1>
          <p className="mt-2 text-xl text-white/70">{report.period}</p>
        </View>
      </Page>

      {/* Content pages */}
      <Page size="A4" className="relative pt-16 pb-12 px-12 font-sans">
        <Header company={report.company} period={report.period} />

        {/* Revenue chart */}
        <View className="break-inside-avoid">
          <h2 className="text-lg font-semibold break-after-avoid">Revenue Overview</h2>
          <Chart className="mt-4 w-full h-56">
            <BarChart width={520} height={220} data={report.quarters}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="M" />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
            </BarChart>
          </Chart>
        </View>

        {/* Sections */}
        {report.sections.map((section, i) => (
          <View key={i} className="mt-8">
            <h2 className="text-base font-semibold break-after-avoid">{section.heading}</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed text-justify [widows:3] [orphans:3]">
              {section.body}
            </p>
            {section.table && <DataTable data={section.table} className="mt-4" />}
          </View>
        ))}
      </Page>

    </Document>
  );
}
```

## Key patterns

- `break-after-avoid` on headings — keeps headings with the following paragraph.
- `break-inside-avoid` on the chart block — the chart never splits across pages.
- `text-justify` + `[widows:3] [orphans:3]` — tight paged typography.
- `<Header>` uses `absolute` positioning — floated to the page margin,
  independent of content flow.
- `<PageNumber>` and `<TotalPages>` resolve at render time; they correctly
  account for all pages including the cover.
