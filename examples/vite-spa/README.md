# example - vite-spa

Vite + React single-page app whose button renders the `invoice` fixture to a PDF
entirely in the browser, then opens it in a new tab.

## What's shown

The Category E browser glue: import `pdf` from the **standalone** entry, render
a fixture to bytes, wrap them in a `Blob`, and hand the object URL to
`window.open`.

```ts
const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
window.open(url);
```

## Run

```bash
pnpm --filter @imprint-pdf/example-vite-spa dev
# → open the printed localhost URL, click "Open invoice PDF"
```

## DX notes

- **Category:** E (browser, bytes → Blob → `window.open`)
- **Entry:** browser - `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 3 lines (`pdf` → `Blob` → `window.open`)
- **Rating:** 🟢 - Vite bundles the standalone WASM build with zero extra
  config.
