/**
 * Chromium suite — same 1-page invoice rendered via headless Chromium
 * (Puppeteer's `page.pdf()`). Two scenarios:
 *
 *   chromium (warm)  — single browser + single page reused across runs.
 *                       This is the steady-state hot path most servers use.
 *   chromium (cold)  — fresh browser launch + new page per render.
 *                       This is what serverless functions actually pay
 *                       (no warm container, ~200 MB binary cold).
 *
 * Defaults to fewer iterations than the JS suites because each run is
 * 100–3000× slower; even modest warmup runs add real seconds.
 */

import { INVOICE_DATA } from '../fixtures/invoice.js';
import { type BenchResult, bench } from '../runner.js';

function renderInvoiceHtml(): string {
  const d = INVOICE_DATA;
  const rows = d.items
    .map(
      (i) => `
        <tr>
          <td class="desc">${i.description}</td>
          <td class="num">${i.qty}</td>
          <td class="num">$${i.unitPrice.toFixed(2)}</td>
          <td class="num">$${i.amount.toFixed(2)}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 40px; }
  body { font-family: Helvetica, Arial, sans-serif; color: #333; font-size: 10px; margin: 0; }
  .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .company { font-size: 20px; font-weight: bold; color: #111; }
  .title { font-size: 24px; font-weight: bold; color: #1a56db; text-align: right; }
  .muted { color: #6b7280; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .label { font-size: 8px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  thead td { background: #f3f4f6; font-size: 8px; text-transform: uppercase;
             color: #6b7280; padding: 6px 4px; border-bottom: 1px solid #e5e7eb; }
  tbody td { padding: 5px 4px; border-bottom: 1px solid #f3f4f6; }
  td.num { text-align: right; }
  td.desc { width: 60%; }
  .totals { margin-top: 16px; display: flex; flex-direction: column; align-items: flex-end; }
  .totalRow { display: flex; width: 200px; justify-content: space-between; margin-bottom: 4px; }
  .grand { font-weight: bold; font-size: 12px; color: #111;
           border-top: 1px solid #e5e7eb; padding-top: 4px; margin-top: 4px; }
</style></head><body>
  <div class="header">
    <div>
      <div class="company">${d.from.name}</div>
      <div class="muted">${d.from.address}</div>
      <div class="muted">${d.from.city}</div>
    </div>
    <div>
      <div class="title">INVOICE</div>
      <div class="muted" style="text-align:right">${d.invoiceNumber}</div>
      <div class="muted" style="text-align:right">Date: ${d.date}</div>
    </div>
  </div>
  <div class="meta">
    <div>
      <div class="label">Billed From</div>
      <div>${d.from.name}</div>
      <div>${d.from.address}</div>
      <div>${d.from.city}</div>
    </div>
    <div>
      <div class="label">Billed To</div>
      <div>${d.to.name}</div>
      <div>${d.to.address}</div>
      <div>${d.to.city}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <td>Description</td><td class="num">Qty</td>
      <td class="num">Unit Price</td><td class="num">Amount</td>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="totalRow"><span class="muted">Subtotal</span><span>$${d.subtotal.toFixed(2)}</span></div>
    <div class="totalRow"><span class="muted">Tax (8%)</span><span>$${d.tax.toFixed(2)}</span></div>
    <div class="totalRow grand"><span>Total</span><span>$${d.total.toFixed(2)}</span></div>
  </div>
</body></html>`;
}

export async function runChromium(runs: number, warmup: number): Promise<BenchResult[]> {
  const { default: puppeteer } = await import('puppeteer');
  const html = renderInvoiceHtml();
  const results: BenchResult[] = [];

  // Warm browser + page reused across runs — the realistic server steady state.
  const warmBrowser = await puppeteer.launch({ headless: true });
  const warmPage = await warmBrowser.newPage();
  try {
    results.push(
      await bench(
        'chromium (warm)',
        async () => {
          await warmPage.setContent(html, { waitUntil: 'load' });
          return await warmPage.pdf({ format: 'A4', printBackground: true });
        },
        runs,
        warmup,
      ),
    );
  } finally {
    await warmBrowser.close();
  }

  // Cold browser launch per render — what serverless functions actually pay.
  // Cap iterations to keep total wall-clock sane (each run is multi-second).
  const coldRuns = Math.min(runs, 5);
  const coldWarmup = Math.min(warmup, 1);
  results.push(
    await bench(
      'chromium (cold)',
      async () => {
        const browser = await puppeteer.launch({ headless: true });
        try {
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: 'load' });
          return await page.pdf({ format: 'A4', printBackground: true });
        } finally {
          await browser.close();
        }
      },
      coldRuns,
      coldWarmup,
    ),
  );

  return results;
}
