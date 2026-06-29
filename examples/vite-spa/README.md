# example - vite-spa

Vite + React single-page app that renders a PDF **entirely in the browser**
using the project's real Tailwind theme, then opens it in a new tab.

## What's shown

- The bare `import { pdf } from '@imprint-pdf/react'` resolves to the pure-WASM
  build in the browser via export conditions - no `/standalone`, no patches.
- `imprint()` from `@imprint-pdf/vite` compiles the PDF's Tailwind classes
  against `src/app.css` (a custom `@theme`) at **build time**, exposed as
  `virtual:imprint-classes`. The browser renders with the real theme (e.g. the
  custom `text-brand` color) and never bundles the Tailwind compiler.

```ts
import { classMap } from 'virtual:imprint-classes';
const bytes = await pdf(<BrandInvoice />, { as: 'bytes', tailwind: { classMap } });
window.open(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })));
```

## Run

```bash
pnpm --filter @imprint-pdf/example-vite-spa dev
# → open the printed localhost URL, click "Open branded PDF"
```

## DX notes

- **Category:** E (browser, bytes → Blob → `window.open`)
- **Entry:** bare `import { pdf } from '@imprint-pdf/react'` (browser condition
  → WASM build)
- **Tailwind:** project theme via the `imprint()` build plugin + `classMap` - no
  Tailwind engine in the bundle
- **Rating:** 🟢 - one bare import, one plugin, full project theme client-side
