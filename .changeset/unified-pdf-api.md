---
'@imprint-pdf/react': minor
'@imprint-pdf/next': minor
---

Unified `pdf()` entry point.

`pdf(element, options?)` is now the single recommended way to render a PDF. It
picks output shape via `options.as` — `'response'` (default, returns a
`Response` with PDF headers), `'bytes'` (`Uint8Array`), or `'stream'`
(`ReadableStream<Uint8Array>`) — auto-loads `imprint.config.ts` from the project
root, and on `@imprint-pdf/next` auto-detects edge vs Node and dispatches to the
matching `@imprint-pdf/react` build.

```ts
// 95% case — Next.js route handler:
export const GET = () => pdf(<Invoice />);

// Power-user escape hatches:
const bytes  = await pdf(<Doc />, { as: 'bytes'  });
const stream = await pdf(<Doc />, { as: 'stream' });
```

Overloads narrow the return type by the literal value of `as` — no manual casts.

The previous fragmented surface (`renderToServer`, `renderToEdge`,
`createPdfResponse`) remains as soft-deprecated aliases that delegate to
`pdf()`. They emit `@deprecated` JSDoc and will be removed in the next major.
`getImprintConfig` is no longer publicly exported — the loader is now internal
and runs automatically inside `pdf()`.
