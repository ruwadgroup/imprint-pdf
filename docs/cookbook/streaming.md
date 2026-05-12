# Cookbook — Streaming PDFs

imprint-pdf can stream pages as they are rendered. The first byte arrives in <
50 ms for most documents; the client's PDF viewer can begin rendering while
remaining pages are still being generated.

## `pdf(..., { as: 'stream' })`

```ts
import { pdf } from '@imprint-pdf/react';

const stream = await pdf(<LargeReport data={data} />, { as: 'stream' });

// Node.js / Bun
return new Response(stream, {
  headers: { 'content-type': 'application/pdf' },
});
```

The `'stream'` shape returns a `ReadableStream<Uint8Array>` that emits one chunk
per page, followed by the cross-reference table when all pages are complete.

## Cloudflare Workers

```ts
import { pdf } from '@imprint-pdf/react/standalone';
import wasm from '@imprint-pdf/react/imprint.wasm';

// Default shape is Response, which is what most edge handlers want anyway.
return pdf(<Report data={data} />, { wasm });

// If you need the raw stream (e.g. to compose another transform):
const stream = await pdf(<Report data={data} />, { wasm, as: 'stream' });
return new Response(stream, { headers: { 'content-type': 'application/pdf' } });
```

## Piping to a file (Node.js)

```ts
import { pdf } from '@imprint-pdf/react';
import { createWriteStream } from 'node:fs';
import { Writable } from 'node:stream';

const stream = await pdf(<Report data={data} />, { as: 'stream' });
await stream.pipeTo(Writable.toWeb(createWriteStream('./output.pdf')));
```

## When to use each shape

| Scenario                              | Recommendation                               |
| ------------------------------------- | -------------------------------------------- |
| Web framework route (Next, Hono, Bun) | `pdf(<Doc />)` — default Response shape      |
| Single-page invoice / certificate     | `pdf(<Doc />, { as: 'bytes' })`              |
| Multi-page report (10+ pages)         | `pdf(<Doc />, { as: 'stream' })`             |
| Edge function with low memory budget  | `pdf(<Doc />, { as: 'stream' })`             |
| Pipe directly to S3 / object storage  | `pdf(<Doc />, { as: 'stream' })`             |
| Client needs to open PDF in a new tab | `pdf(<Doc />)` → `URL.createObjectURL(blob)` |

## Progress tracking

```ts
let pagesRendered = 0;

const stream = await pdf(<Report pages={50} data={data} />, {
  as: 'stream',
  onPageRendered: (pageNumber) => {
    pagesRendered = pageNumber;
    console.log(`Page ${pageNumber} ready`);
  },
});
```
