# example - next-server-action

**What's shown:** Next.js App Router **Server Action** that renders the shared
`invoice` fixture on the server and hands base64 bytes to a client component,
which builds a `Blob` and triggers a browser download.

```bash
pnpm --filter @imprint-pdf/example-next-server-action dev
# then open http://localhost:3000 and click "Download invoice.pdf"
```

- `app/actions.ts` - `'use server'` action: `pdf(..., { as: 'bytes' })` → base64
  string.
- `app/download-invoice.tsx` - `'use client'` form whose action calls the server
  action and `URL.createObjectURL`s the bytes into a download.

## DX notes

- **Category:** A - React meta-framework. The server returns **bytes** (base64
  over the action boundary), not a `Response`; the browser owns the download.
- **Glue LoC:** ~8 (3-line server action + ~5 lines of client blob/download).
- **Entry:** `@imprint-pdf/next` `pdf` with `{ as: 'bytes' }` (Node runtime in
  the Server Action). Not the `standalone` build.
- **Friction:** 🟡 - Server Actions can't stream a file response, so PDF bytes
  must cross the RPC boundary as base64 and be reassembled into a `Blob`
  client-side. More moving parts than a route handler for a pure download.
