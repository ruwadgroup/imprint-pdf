# Vite

Vite + React SPA and SSR support via the `@imprint-pdf/vite` plugin.

## Install

```bash
pnpm add @imprint-pdf/react @imprint-pdf/core
pnpm add -D @imprint-pdf/vite @imprint-pdf/tailwind tailwindcss vite
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
import { renderToBuffer } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

async function downloadPdf() {
  const pdf = await renderToBuffer(
    <Invoice data={{ id: 'INV-001', customer: 'Acme Corp', total: 4200 }} />,
  );

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
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

The `imprint dev` server uses the Vite plugin's HMR integration — edit your
template, the preview reloads without a full rebuild.

## SSR (Vike, Astro)

For SSR frameworks built on Vite, `renderToBuffer` runs on the server path
normally — no special config needed. Add `@imprint-pdf/vite` to the Vite plugin
list and use `renderToBuffer` in your server route.

## Virtual font module

The Vite plugin provides a virtual module for font imports so you can write:

```ts
import interFont from 'virtual:imprint/font?url&family=Inter';
```

instead of managing `fs.readFileSync` paths manually.

## WASM assets

The plugin handles `.wasm` asset copying and `?url` imports automatically. The
WASM modules are fingerprinted and cached by the browser after the first load.
