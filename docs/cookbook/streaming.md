# Cookbook — Streaming PDFs

Imprint can stream pages as they are rendered. The first byte arrives in < 50 ms
for most documents; the client's PDF viewer can begin rendering while remaining
pages are still being generated.

## `renderToStream`

```ts
import { renderToStream } from '@imprint-pdf/react';

const stream = await renderToStream(<LargeReport data={data} />);

// Node.js / Bun
return new Response(stream, {
  headers: { 'content-type': 'application/pdf' },
});
```

`renderToStream` returns a `ReadableStream<Uint8Array>` that emits one chunk per
page, followed by the cross-reference table when all pages are complete.

## Cloudflare Workers

```ts
import { renderToStream } from '@imprint-pdf/react/standalone';
import wasm from '@imprint-pdf/react/imprint.wasm';

const stream = await renderToStream(<Report data={data} />, { wasm });
return new Response(stream, { headers: { 'content-type': 'application/pdf' } });
```

## Piping to a file (Node.js)

```ts
import { renderToStream } from '@imprint-pdf/react';
import { createWriteStream } from 'node:fs';
import { Writable } from 'node:stream';

const stream = await renderToStream(<Report data={data} />);
const fileStream = createWriteStream('./output.pdf');

await stream.pipeTo(Writable.toWeb(fileStream));
```

## When to use streaming vs. `renderToBuffer`

| Scenario                              | Recommendation                           |
| ------------------------------------- | ---------------------------------------- |
| Single-page invoice / certificate     | `renderToBuffer`                         |
| Multi-page report (10+ pages)         | `renderToStream`                         |
| Edge function with low memory budget  | `renderToStream`                         |
| Need to pipe directly to S3 / storage | `renderToStream`                         |
| Client needs to open PDF in a new tab | `renderToBuffer` → `URL.createObjectURL` |

## Progress tracking

```ts
let pagesRendered = 0;

const stream = await renderToStream(<Report pages={50} data={data} />, {
  onPageRendered: (pageNumber) => {
    pagesRendered = pageNumber;
    console.log(`Page ${pageNumber} ready`);
  },
});
```
