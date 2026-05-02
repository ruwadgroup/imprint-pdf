/**
 * Multi-page report fixture for Imprint complexity benchmarks.
 *
 * Each page contains an H2 heading, 3 lorem-ipsum paragraphs, and a
 * 3-column × 5-row table. The `pages` prop controls how many pages are
 * rendered (default 10).
 */

import { Document, Page } from '@imprint/react';
import type React from 'react';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
  'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure ' +
  'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

const TABLE_HEADERS = ['Category', 'Value', 'Notes'];

function tableRows(pageIndex: number): Array<[string, string, string]> {
  return Array.from({ length: 5 }, (_, i) => [
    `Item ${pageIndex * 5 + i + 1}`,
    `${((pageIndex + 1) * (i + 1) * 3.14).toFixed(2)}`,
    `Row ${i + 1} of page ${pageIndex + 1}`,
  ]);
}

const s = {
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#333' } as Record<
    string,
    unknown
  >,
  heading: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 12 } as Record<
    string,
    unknown
  >,
  para: { marginBottom: 10, lineHeight: 1.6 } as Record<string, unknown>,
  table: { width: '100%', marginTop: 20 } as Record<string, unknown>,
  thead: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: '4px 0',
    borderBottom: '1px solid #e5e7eb',
  } as Record<string, unknown>,
  th: {
    flex: 1,
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#6b7280',
    paddingLeft: 4,
  } as Record<string, unknown>,
  tr: {
    display: 'flex',
    flexDirection: 'row',
    padding: '4px 0',
    borderBottom: '1px solid #f3f4f6',
  } as Record<string, unknown>,
  td: { flex: 1, paddingLeft: 4 } as Record<string, unknown>,
};

export interface ReportDocProps {
  pages?: number;
}

export function ReportDoc({ pages = 10 }: ReportDocProps): React.ReactElement {
  return (
    <Document title="Benchmark Report">
      {Array.from({ length: pages }, (_, i) => (
        <Page key={i} size="A4" style={s.page}>
          <h2 style={s.heading}>Section {i + 1}: Quarterly Analysis</h2>
          <p style={s.para}>{LOREM}</p>
          <p style={s.para}>{LOREM}</p>
          <p style={s.para}>{LOREM}</p>

          <div style={s.table}>
            <div style={s.thead}>
              {TABLE_HEADERS.map((h) => (
                <span key={h} style={s.th}>
                  {h}
                </span>
              ))}
            </div>
            {tableRows(i).map((row, ri) => (
              <div key={ri} style={s.tr}>
                {row.map((cell, ci) => (
                  <span key={ci} style={s.td}>
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Page>
      ))}
    </Document>
  );
}
