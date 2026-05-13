# Vite

SPA and SSR support via the `@imprint-pdf/vite` plugin.

## Install

```bash
pnpm add @imprint-pdf/react @imprint-pdf/core react tailwindcss
pnpm add -D @imprint-pdf/vite vite
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { imprint } from '@imprint-pdf/vite';

export default defineConfig({
  plugins: [
    react(),
    imprint(),
    // imprint() works with no options — `tailwind.stylesheet` is auto-detected
    // (src/app.css, src/globals.css, …). Override only when you need to:
    //   imprint({ tailwind: { stylesheet: './src/styles/pdf.css' } })
  ],
});
```

## Rendering in the browser

```tsx
// src/App.tsx
import { pdf } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

async function downloadPdf() {
  const response = await pdf(
    <Invoice data={{ id: 'INV-001', customer: 'Acme Corp', total: 4200 }} />,
    { filename: 'invoice.pdf', disposition: 'attachment' },
  );
  // `pdf()` returns a Response — perfect for `fetch`-style code, or drop the
  // bytes into a Blob for a one-shot download trigger.
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoice.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

export function App() {
  return (
    <button type="button" onClick={downloadPdf}>
      Download Invoice
    </button>
  );
}
```

## Dev server + HMR

```bash
npx imprint dev src/templates/Invoice.tsx
# → http://localhost:4000
```

`imprint dev` reuses the Vite plugin's HMR — edit the template, the preview
reloads without a full rebuild.

## SSR (Vike, Astro)

For Vite-based SSR frameworks, `pdf()` runs on the server path normally. Add
`@imprint-pdf/vite` to the plugin list and call `pdf(<Doc/>)` in your server
route — it returns a `Response`.

## Virtual font module

A virtual module for font imports, so you can write:

```ts
import interFont from 'virtual:imprint/font?url&family=Inter';
```

instead of managing `fs.readFileSync` paths manually.

## WASM assets

The plugin handles `.wasm` copying and `?url` imports automatically. WASM
modules are fingerprinted and browser-cached after the first load.
