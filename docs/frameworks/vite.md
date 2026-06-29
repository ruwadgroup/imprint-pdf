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

## Using your project's Tailwind theme in the browser

`@imprint-pdf/react` is isomorphic — the bare import resolves to the pure-WASM
build in the browser via package export conditions, so no `/standalone` import
and no bundler patches are needed.

In the browser the renderer can't run the Tailwind compiler (it pulls Node
deps), and reading classes off the DOM only sees classes your page's CSS still
contains — Tailwind purges the rest. The fix is to **precompile** your PDF's
classes against your project theme at build time (in Node, where Tailwind runs)
and hand the result to `pdf()`. The `imprint()` Vite plugin does this for you:

```ts
// vite.config.ts
import { imprint } from '@imprint-pdf/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // scans your source for the PDF's classes and compiles them against your
  // theme (e.g. ./src/app.css with `@import "tailwindcss"; @theme {…}`),
  // exposed as the virtual module `virtual:imprint-classes`.
  plugins: [imprint({ stylesheet: 'src/app.css' })],
});
```

```tsx
import { pdf } from '@imprint-pdf/react';
import { classMap } from 'virtual:imprint-classes';

// classMap carries your real @theme tokens (custom colors, fonts, spacing).
// pdf() uses it directly — no Tailwind engine ships to the browser.
const bytes = await pdf(<Invoice data={data} />, {
  as: 'bytes',
  tailwind: { classMap },
});
```

Add the virtual-module type to your `vite-env.d.ts`:

```ts
declare module 'virtual:imprint-classes' {
  import type { ResolvedStyle } from '@imprint-pdf/core';
  export const classMap: Record<string, ResolvedStyle>;
  export const classList: string[];
}
```

The full example is `examples/vite-spa`.

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
