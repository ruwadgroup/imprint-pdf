# Bun

imprint-pdf works natively with Bun's WASM support and `Bun.serve`.

## Install

```bash
bun add @imprint-pdf/react @imprint-pdf/core react tailwindcss
```

The Tailwind compiler is bundled inside `@imprint-pdf/react`.

## HTTP server

```ts
// src/index.ts
import { pdf } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/invoice') {
      const id = url.searchParams.get('id') ?? 'demo';
      return pdf(
        <Invoice data={{ id, customer: 'Acme Corp', total: 4200 }} />,
        { filename: `invoice-${id}.pdf`, disposition: 'attachment' },
      );
    }
    return new Response('Not found', { status: 404 });
  },
});

console.log('Imprint server running at http://localhost:3000');
```

`pdf()` returns a `Response` directly — `Bun.serve`'s `fetch` handler accepts it
without further wrapping.

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
import { pdf } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

self.onmessage = async ({ data }) => {
  // Workers want a transferable — `as: 'bytes'` returns a Uint8Array directly.
  const bytes = await pdf(<Invoice data={data} />, { as: 'bytes' });
  self.postMessage(bytes, [bytes.buffer]);
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
