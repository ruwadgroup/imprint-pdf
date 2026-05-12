# @imprint-pdf/next

Next.js integration for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). One `pdf()`
function for route handlers, one `withImprint()` plugin for the config.

```bash
pnpm add @imprint-pdf/next @imprint-pdf/react @imprint-pdf/core tailwindcss
```

Works on Next 14, 15, and 16 — App Router and Pages Router, Node and Edge
runtimes.

## Plugin

```ts
// next.config.ts
import { withImprint } from '@imprint-pdf/next/plugin';

export default withImprint()({
  // your Next.js config
});
```

`withImprint()` does three things:

1. Registers the bundled webpack plugin for compile-time Tailwind class
   extraction (webpack only — Turbopack falls back to runtime compile).
2. Enables the `asyncWebAssembly` + `layers` experiments and adds the
   `webassembly/async` rule for `.wasm` files.
3. Adds `@imprint-pdf/react` and `@imprint-pdf/core` to `serverExternalPackages`
   so Next.js doesn't bundle their server-only internals.

## Route handler

```ts
// app/api/invoice/[id]/route.ts
import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';
import { getInvoice } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getInvoice(id);
  return pdf(<Invoice data={data} />, {
    filename: `invoice-${id}.pdf`,
    disposition: 'attachment',
  });
}
```

`pdf()` returns a `Response`. It auto-loads `imprint.config.ts` from the project
root and auto-detects edge vs Node runtime (via `NEXT_RUNTIME` /
`globalThis.EdgeRuntime`), dispatching to the matching `@imprint-pdf/react`
build automatically.

Want raw bytes? `{ as: 'bytes' }`. A stream? `{ as: 'stream' }`. Same function.

## Edge runtime

Just mark the route — no separate function call.

```ts
// app/api/invoice/[id]/route.ts
export const runtime = 'edge';

import { pdf } from '@imprint-pdf/next';
export const GET = () => pdf(<Invoice data={data} />);
```

## Exports

| Entry                      | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `@imprint-pdf/next`        | `pdf()` with auto edge/Node dispatch     |
| `@imprint-pdf/next/plugin` | `withImprint()` `next.config.ts` wrapper |
