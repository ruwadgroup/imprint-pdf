# Migrating from Puppeteer / headless Chrome

Puppeteer (or Playwright, Gotenberg, PDFShift, DocRaptor) generates PDFs by
rendering HTML in Chromium and printing it. imprint-pdf is a different kind of
tool — it renders React components directly, no browser.

## When to migrate

- **Cold start matters.** Chromium: 800–2,000 ms. imprint-pdf: 40–100 ms on
  Cloudflare Workers.
- **Edge runtime is a requirement.** Chromium can't run on Cloudflare Workers or
  Vercel Edge. imprint-pdf can.
- **Output quality matters.** Knuth–Plass, HarfBuzz, and real page breaking beat
  browser printing on measurable quality.
- **PDF/X or PDF/UA is required.** Chromium can't produce conformant PDF/X-4 or
  PDF/UA-1. imprint-pdf can.
- **Memory / cost.** 200 MB Chromium binary vs. ~4 MB WASM module.

## When to stay on Puppeteer

- Generating PDFs from **existing web pages or arbitrary URLs** you don't
  control. imprint-pdf renders React trees, not URLs.
- Templates maintained by designers in HTML/CSS with complex effects (CSS
  animations, JS, SVG filters) you don't want to port.
- **JavaScript execution inside the PDF** (rare — most viewers don't support it
  anyway).

## Migration strategy

1. **Port templates to React components.** Each Puppeteer HTML template becomes
   a React component with Tailwind classes. The bulk of the work.
2. **Replace Chromium classes with Tailwind.** Resolve styles at component
   author time instead of letting Chromium interpret cascades.
3. **Swap the render call.**

### Before (Puppeteer)

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
const pdf = await page.pdf({ format: 'A4', printBackground: true });
await browser.close();
```

### After (imprint-pdf)

```ts
import { pdf } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

const bytes = await pdf(<Invoice data={invoiceData} />, { as: 'bytes' });
// or `const response = await pdf(<Invoice .../>);` for a fetch-style Response.
```

## Performance comparison

| Metric               | Puppeteer (local) | imprint-pdf (Node) | imprint-pdf (Edge) |
| -------------------- | ----------------- | ------------------ | ------------------ |
| Cold start           | ~1,500 ms         | ~30 ms             | ~80 ms             |
| Warm render (1-page) | ~300 ms           | ~10 ms             | ~20 ms             |
| Memory (idle)        | ~200 MB           | ~40 MB             | ~8 MB              |
| Edge runtime         | ✗                 | Node only          | ✓                  |
