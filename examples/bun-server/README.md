# example — bun-server

Bun HTTP server demo for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Uses Bun's native
WASM support for fast cold starts.

```bash
pnpm --filter @imprint-pdf/example-bun-server dev
# → http://localhost:3000
```

## What's demonstrated

- **`src/index.ts`** — a Bun.serve HTTP handler that generates a PDF invoice on
  `GET /invoice/:id`.
- Bun's native WASM loading — no `WebAssembly.instantiateStreaming` ceremony;
  just `import wasm from '…'`.
- Batch generation: `POST /batch` accepts a JSON array and returns a ZIP of
  rendered PDFs using streaming.

## Structure

```
examples/bun-server/
├── src/
│   ├── index.ts
│   └── templates/Invoice.tsx
└── imprint.config.ts
```
