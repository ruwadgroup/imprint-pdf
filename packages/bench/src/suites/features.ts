/**
 * Features suite — three equal-sized (1 page) Imprint documents that stress
 * different rendering paths:
 *   text-heavy  — 20 paragraphs, mixed font sizes, no images
 *   table-heavy — 3 tables × 20 rows × 4 columns
 *   mixed       — 2 paragraphs + 1 table + 1 inline SVG placeholder
 *
 * All three documents are built with React.createElement (no JSX) so this
 * file can remain a plain .ts file without a JSX transform.
 */

import { Document, Page, renderToBuffer } from '@imprint-pdf/react';
import React from 'react';
import { type BenchResult, bench } from '../runner.js';

const LOREM =
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque ' +
  'laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi ' +
  'architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas ' +
  'sit aspernatur aut odit aut fugit.';

const TEXT_SIZES = [10, 11, 12, 10, 9, 11, 10, 12, 9, 10, 11, 10, 12, 10, 9, 11, 10, 10, 12, 11];

function buildTextHeavyDoc(): React.ReactElement {
  return React.createElement(
    Document,
    { title: 'Text Heavy' },
    React.createElement(
      Page,
      { size: 'A4', style: { padding: 40, fontFamily: 'Helvetica' } },
      ...TEXT_SIZES.map((sz, i) =>
        React.createElement(
          'p',
          { key: i, style: { fontSize: sz, marginBottom: 8, color: '#333' } },
          LOREM,
        ),
      ),
    ),
  );
}

const TABLE_HEADERS = ['ID', 'Name', 'Status', 'Value'];

function buildTableRows(): Array<string[]> {
  return Array.from({ length: 20 }, (_, i) => [
    String(i + 1),
    `Item ${i + 1}`,
    i % 2 === 0 ? 'Active' : 'Pending',
    `$${((i + 1) * 12.5).toFixed(2)}`,
  ]);
}

function buildSingleTable(tableIdx: number, rows: Array<string[]>): React.ReactElement {
  const tableStyle: React.CSSProperties = { width: '100%', marginBottom: 12 };
  const theadStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: '3px 0',
  };
  const trStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    padding: '3px 0',
    borderBottom: '1px solid #f3f4f6',
  };
  const thStyle: React.CSSProperties = { flex: 1, fontSize: 8, color: '#6b7280', paddingLeft: 4 };
  const tdStyle: React.CSSProperties = { flex: 1, fontSize: 8, paddingLeft: 4 };

  return React.createElement(
    'div',
    { key: tableIdx, style: tableStyle },
    React.createElement(
      'div',
      { style: theadStyle },
      ...TABLE_HEADERS.map((h) => React.createElement('span', { key: h, style: thStyle }, h)),
    ),
    ...rows.map((row, ri) =>
      React.createElement(
        'div',
        { key: ri, style: trStyle },
        ...row.map((cell, ci) => React.createElement('span', { key: ci, style: tdStyle }, cell)),
      ),
    ),
  );
}

function buildTableHeavyDoc(): React.ReactElement {
  const rows = buildTableRows();
  return React.createElement(
    Document,
    { title: 'Table Heavy' },
    React.createElement(
      Page,
      { size: 'A4', style: { padding: 40, fontFamily: 'Helvetica', fontSize: 9 } },
      buildSingleTable(0, rows),
      buildSingleTable(1, rows),
      buildSingleTable(2, rows),
    ),
  );
}

function buildMixedDoc(): React.ReactElement {
  const colStyle: React.CSSProperties = { flex: 1, fontSize: 8, color: '#6b7280', paddingLeft: 4 };
  const cellStyle: React.CSSProperties = { flex: 1, paddingLeft: 4 };
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    padding: '4px 0',
    borderBottom: '1px solid #f3f4f6',
  };

  return React.createElement(
    Document,
    { title: 'Mixed' },
    React.createElement(
      Page,
      { size: 'A4', style: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 } },
      React.createElement('p', { style: { marginBottom: 10, color: '#333' } }, LOREM),
      React.createElement('p', { style: { marginBottom: 16, color: '#333' } }, LOREM),
      React.createElement(
        'div',
        { style: { width: '100%', marginBottom: 16 } },
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'row',
              backgroundColor: '#f3f4f6',
              padding: '4px 0',
            },
          },
          ...['Column A', 'Column B', 'Column C'].map((h) =>
            React.createElement('span', { key: h, style: colStyle }, h),
          ),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          React.createElement(
            'div',
            { key: i, style: rowStyle },
            React.createElement('span', { style: cellStyle }, `Alpha ${i + 1}`),
            React.createElement('span', { style: cellStyle }, `Beta ${i + 1}`),
            React.createElement('span', { style: cellStyle }, `Gamma ${i + 1}`),
          ),
        ),
      ),
      // Inline SVG placeholder — exercises the SVG rendering path
      React.createElement(
        'svg',
        {
          width: 200,
          height: 80,
          viewBox: '0 0 200 80',
          style: { display: 'block', marginTop: 8 },
        },
        React.createElement('rect', { x: 0, y: 0, width: 200, height: 80, fill: '#e0f2fe', rx: 4 }),
        React.createElement('rect', {
          x: 10,
          y: 10,
          width: 180,
          height: 60,
          fill: '#bae6fd',
          rx: 2,
        }),
      ),
    ),
  );
}

export async function runFeatures(runs: number, warmup: number): Promise<BenchResult[]> {
  const results: BenchResult[] = [];

  results.push(await bench('text-heavy', () => renderToBuffer(buildTextHeavyDoc()), runs, warmup));
  results.push(
    await bench('table-heavy', () => renderToBuffer(buildTableHeavyDoc()), runs, warmup),
  );
  results.push(await bench('mixed', () => renderToBuffer(buildMixedDoc()), runs, warmup));

  return results;
}
