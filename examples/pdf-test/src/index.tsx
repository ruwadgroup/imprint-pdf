import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { googleProvider, loadFont } from '@imprint-pdf/font';
import { renderToBuffer } from '@imprint-pdf/react';
import { invoice } from './data/invoice.js';
import { report } from './data/report.js';
import { salesOrder } from './data/salesOrder.js';
import { Invoice } from './templates/Invoice.js';
import { Report } from './templates/Report.js';
import { SalesInvoice } from './templates/SalesInvoice.js';

const OUT_DIR = join(import.meta.dirname, '..', 'out');
const PROJECT_ROOT = join(import.meta.dirname, '..');

interface Template {
  name: string;
  element: React.ReactElement;
}

const templates: Template[] = [
  {
    name: 'invoice',
    element: <Invoice data={invoice} />,
  },
  {
    name: 'sales-invoice',
    element: <SalesInvoice data={salesOrder} />,
  },
  {
    name: 'quarterly-report',
    element: <Report data={report} />,
  },
];

mkdirSync(OUT_DIR, { recursive: true });

console.log('\n  imprint pdf-test\n');

// Load Outfit from Google Fonts once; all templates share the same font set.
const fonts = await loadFont(googleProvider(), 'Outfit', { weights: [400, 600, 700] });

for (const { name, element } of templates) {
  const start = performance.now();
  const pdf = await renderToBuffer(element, { fonts, tailwind: { projectRoot: PROJECT_ROOT } });
  const ms = (performance.now() - start).toFixed(0);
  const kb = (pdf.byteLength / 1024).toFixed(1);
  const outPath = join(OUT_DIR, `${name}.pdf`);
  writeFileSync(outPath, pdf);
  console.log(`  ✓  ${name}.pdf  ${kb} KB  (${ms}ms)`);
}

console.log(`\n  Output → ${OUT_DIR}\n`);
