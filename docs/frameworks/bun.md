# Bun

imprint-pdf works natively with Bun's WASM support and `Bun.serve`.

## Install

```bash
bun add @imprint-pdf/react @imprint-pdf/core
bun add -d @imprint-pdf/tailwind tailwindcss
```

## HTTP server

```ts
// src/index.ts
import { renderToBuffer } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') ?? 'demo';

    if (url.pathname === '/invoice') {
      const pdf = await renderToBuffer(
        <Invoice data={{ id, customer: 'Acme Corp', total: 4200 }} />
      );

      return new Response(pdf, {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="invoice-${id}.pdf"`,
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
});

console.log('Imprint server running at http://localhost:3000');
```

```bash
bun run --watch src/index.ts
```

## WASM in Bun

Bun loads WASM natively — no `WebAssembly.instantiateStreaming` ceremony. The
`@imprint-pdf/react` package detects the Bun runtime and uses the appropriate
loading path automatically.

## Batch generation

Bun's multi-threading via `Worker` makes batch generation practical:

```ts
// worker.ts
import { renderToBuffer } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

self.onmessage = async ({ data }) => {
  const pdf = await renderToBuffer(<Invoice data={data} />);
  self.postMessage(pdf, [pdf.buffer]);
};
```

```ts
// batch.ts
const workers = Array.from({ length: 4 }, () => new Worker('./worker.ts'));
const invoices = await fetchInvoices();

const pdfs = await Promise.all(
  invoices.map(
    (data, i) =>
      new Promise<Uint8Array>((resolve) => {
        workers[i % workers.length]!.onmessage = (e) => resolve(e.data);
        workers[i % workers.length]!.postMessage(data);
      }),
  ),
);
```

## Example

See [`examples/bun-server`](../../examples/bun-server).
