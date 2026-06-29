# example - browser-standalone

A no-bundler HTML page that renders the `invoice` fixture to a PDF in the
browser and offers a Blob download - no Vite, no build step on the glue itself.

## What's shown

The Category E bundler-free glue: import `pdf` from the **standalone** entry,
render a fixture to bytes, and trigger an `<a download>` on a `Blob` URL.

```ts
const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
// ...assign to <a download> and click
```

## Run

```bash
pnpm --filter @imprint-pdf/example-browser-standalone typecheck
```

Open `index.html` from a static server. In real no-bundler use the module loads
straight from a CDN (esm.sh); here `app.ts` imports the workspace package so the
glue typechecks against the same API.

## DX notes

- **Category:** E (browser, bytes → Blob → `<a download>`)
- **Entry:** browser - `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 3 lines (`pdf` → `Blob` → download)
- **Rating:** 🟡 - no bundler means the runtime import path (CDN) differs from
  the workspace import used for typechecking; one extra mental hop versus
  `vite-spa`.
