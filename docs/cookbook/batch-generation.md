# Cookbook — Batch generation

Generating hundreds or thousands of PDFs efficiently.

## Concurrency model

`renderToBuffer` and `renderToStream` are CPU-bound (WASM layout + shaping).
They do not benefit from Node.js event loop concurrency. For true parallelism:

- **Node.js**: use `worker_threads`.
- **Bun**: use `Worker`.
- **Cloudflare**: deploy multiple Workers; use a queue.

## Node.js — worker thread pool

```ts
// src/worker.ts (run in a worker thread)
import { parentPort, workerData } from 'node:worker_threads';
import { renderToBuffer } from '@imprint-pdf/react';
import { Invoice } from './templates/Invoice';

const pdf = await renderToBuffer(<Invoice data={workerData} />);
parentPort!.postMessage(pdf, [pdf.buffer]);
```

```ts
// src/batch.ts
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';

const POOL_SIZE = cpus().length;

function renderInWorker(data: InvoiceData): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const w = new Worker('./dist/worker.js', { workerData: data });
    w.on('message', resolve);
    w.on('error', reject);
  });
}

async function generateBatch(invoices: InvoiceData[]): Promise<Uint8Array[]> {
  const chunks = [];
  for (let i = 0; i < invoices.length; i += POOL_SIZE) {
    const batch = invoices.slice(i, i + POOL_SIZE);
    const results = await Promise.all(batch.map(renderInWorker));
    chunks.push(...results);
  }
  return chunks;
}
```

## Uploading to object storage

```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

async function uploadPdf(key: string, pdf: Uint8Array) {
  await s3.send(
    new PutObjectCommand({
      Bucket: 'my-invoices',
      Key: key,
      Body: pdf,
      ContentType: 'application/pdf',
    }),
  );
}

const pdfs = await generateBatch(invoices);
await Promise.all(
  pdfs.map((pdf, i) => uploadPdf(`invoices/${invoices[i]!.id}.pdf`, pdf)),
);
```

## Throughput estimates

Measured on a 4-core Node 22 / M2 MacBook with `renderToBuffer` in 4 worker
threads:

| Document type                       | Throughput  |
| ----------------------------------- | ----------- |
| 1-page invoice, 5 Tailwind classes  | ~120 PDFs/s |
| 1-page invoice, 50 Tailwind classes | ~80 PDFs/s  |
| 5-page report with a chart          | ~18 PDFs/s  |

WASM is instantiated once per worker thread. Warm throughput is limited by the
Knuth–Plass and HarfBuzz shaping passes — scale horizontally by adding workers.
