/**
 * End-to-end integration test: render every example template from
 * `examples/pdf-test/src/templates` through the full pipeline and assert
 * structural invariants (page count, expected text, no rendering errors).
 *
 * This is the test that would catch regressions affecting any real-world
 * template — invoice, sales-invoice, quarterly-report.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { googleProvider, loadFont } from '@imprint-pdf/fonts';
import { describe, expect, it } from 'vitest';
import { invoice } from '../../../../examples/pdf-test/src/data/invoice.js';
import { report } from '../../../../examples/pdf-test/src/data/report.js';
import { salesOrder } from '../../../../examples/pdf-test/src/data/salesOrder.js';
import { Invoice } from '../../../../examples/pdf-test/src/templates/Invoice.js';
import { Report } from '../../../../examples/pdf-test/src/templates/Report.js';
import { SalesInvoice } from '../../../../examples/pdf-test/src/templates/SalesInvoice.js';
import { extractText, inspect, render } from '../../src/helpers/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PDF_TEST_ROOT = resolve(HERE, '..', '..', '..', '..', 'examples', 'pdf-test');

describe('example templates render end-to-end', () => {
  it('renders the invoice template', async () => {
    const pdf = await render(<Invoice data={invoice} />, {
      tailwind: { projectRoot: PDF_TEST_ROOT },
    });
    const meta = await inspect(pdf);
    expect(meta.pageCount).toBeGreaterThanOrEqual(1);
    const [first] = await extractText(pdf);
    const flat = first!.map((i) => i.text).join('|');
    expect(flat.toLowerCase()).toContain('invoice');
  });

  it('renders the sales-invoice template', async () => {
    const pdf = await render(<SalesInvoice data={salesOrder} />, {
      tailwind: { projectRoot: PDF_TEST_ROOT },
    });
    const meta = await inspect(pdf);
    expect(meta.pageCount).toBeGreaterThanOrEqual(1);
  });

  it('renders the quarterly-report template with Outfit and bookmarks', async () => {
    const fonts = await loadFont(googleProvider(), 'Outfit', { weights: [400, 600, 700] });
    const pdf = await render(<Report data={report} />, {
      fonts,
      tailwind: { projectRoot: PDF_TEST_ROOT },
    });
    const meta = await inspect(pdf);
    expect(meta.pageCount).toBeGreaterThanOrEqual(2);
    expect(meta.hasOutline).toBe(true);

    // Revenue Analysis page must contain every month label on a single line.
    // (This is the regression that motivated the e2e suite.)
    const pages = await extractText(pdf);
    const allText = pages.flat().map((i) => i.text);
    for (const m of ['Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025']) {
      expect(allText.some((t) => t.includes(m))).toBe(true);
    }
  });
});
