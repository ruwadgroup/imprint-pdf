# Next.js

First-class Next.js App Router support — route handlers, RSC helpers, Edge
Runtime, and the `withImprint` plugin.

## Install

```bash
pnpm add @imprint-pdf/next @imprint-pdf/react @imprint-pdf/core tailwindcss
```

## Plugin

```ts
// next.config.ts
import { withImprint } from '@imprint-pdf/next/plugin';

export default withImprint()({
  // your Next.js config
});
```

`withImprint()` does four things:

1. Registers the webpack plugin for compile-time class extraction (webpack only
   — Turbopack falls back to runtime compile).
2. Enables the `asyncWebAssembly` and `layers` webpack experiments and adds a
   `webassembly/async` rule for `.wasm` files (required by the renderer).
3. Adds `@imprint-pdf/react`, `@imprint-pdf/core`, and `@imprint-pdf/next` to
   `serverExternalPackages` (Next 15) and
   `experimental.serverComponentsExternalPackages` (Next 14) so Next.js doesn't
   bundle their server-only internals.
4. Adds `tailwindcss` and `postcss` to the same externals lists and writes
   `experimental.outputFileTracingIncludes` globs so the file tracer copies them
   into `.next/standalone` — required for `output: 'standalone'` Docker / Vercel
   / Coolify deployments. See
   **[Standalone deployments](#standalone-deployments)** below.

## Route handler

```ts
// app/api/invoice/[id]/route.ts
import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';
import { getInvoice } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getInvoice(id);
  return pdf(<Invoice data={data} />, {
    filename: `invoice-${id}.pdf`,
    disposition: 'attachment', // or 'inline' (default)
  });
}
```

`pdf()` returns a `Response`, auto-loads `imprint.config.ts`, and auto-detects
Node vs Edge runtime.

## Edge Runtime

Set `runtime = 'edge'` on the route — that's it. `pdf()` detects
`NEXT_RUNTIME === 'edge'` and switches to the standalone WASM-only bundle.

```ts
// app/api/invoice/[id]/route.ts
export const runtime = 'edge';

import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/Invoice';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return pdf(<Invoice data={{ id }} />, { as: 'stream' });
}
```

`{ as: 'stream' }` returns a `ReadableStream<Uint8Array>` — useful when you want
to wrap it yourself (e.g. compose with another transform). The default
`as: 'response'` is what most edge routes want.

## Power-user output shapes

| Shape                            | Use case                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| `pdf(<Doc />)` (default)         | Web framework integration — returns a `Response`.           |
| `pdf(<Doc />, { as: 'bytes' })`  | Writing to disk, attaching to email, custom HTTP framework. |
| `pdf(<Doc />, { as: 'stream' })` | Edge runtimes with tight memory budgets.                    |

## Caching route handler output

```ts
export const revalidate = 3600; // revalidate every hour

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getInvoice(id);
  const response = await pdf(<Invoice data={data} />);
  // Append your own cache headers on top of the defaults.
  response.headers.set('cache-control', 'public, max-age=3600');
  return response;
}
```

## Standalone deployments

If you ship via `output: 'standalone'` (Docker, Coolify, self-hosted Vercel,
most production Next.js setups), the runtime layout differs from `next dev`:
`next build` runs Vercel's [node-file-tracer](https://github.com/vercel/nft)
across each route's import graph and copies only the matched files into
`.next/standalone/node_modules`. Anything imported dynamically that nft can't
statically follow is left behind.

imprint-pdf resolves a few packages dynamically at render time:

- The matching `react-reconciler` for your React major (R18 vs R19)
- The consumer's `tailwindcss` and `postcss` for v3 Tailwind compilation
- The consumer's `tailwind.config.{ts,js,mjs,cjs}` for v3 dispatch

Using `withImprint()` from `@imprint-pdf/next/plugin` (≥ `1.0.0-alpha.8`) is the
supported path — it tells nft about all of the above. Without the plugin,
typical failures look like:

```text
Error: Cannot find module 'react-reconciler-18'
Require stack: - /app/node_modules/.../@imprint-pdf/react/dist/index.js

# or

[imprint-tailwind] Tailwind v3 compilation failed:
Error: Cannot find module 'tailwindcss'
Require stack: - /app/package.json
```

### If you can't use `withImprint()`

If your `next.config` is heavily customised and dropping in `withImprint()`
isn't practical, set the same keys yourself:

```js
// next.config.{js,mjs,ts}
const nextConfig = {
  output: 'standalone',

  serverExternalPackages: [
    '@imprint-pdf/react',
    '@imprint-pdf/core',
    '@imprint-pdf/next',
    'tailwindcss',
    'postcss',
  ],

  experimental: {
    // Next 14 — Next 15+ reads the top-level key above.
    serverComponentsExternalPackages: [
      '@imprint-pdf/react',
      '@imprint-pdf/core',
      '@imprint-pdf/next',
      'tailwindcss',
      'postcss',
    ],
    // Belt-and-suspenders for nft — both root and pnpm `.pnpm/` layouts.
    outputFileTracingIncludes: {
      '**/*': [
        './node_modules/tailwindcss/**/*',
        './node_modules/postcss/**/*',
        './node_modules/.pnpm/tailwindcss@*/node_modules/tailwindcss/**/*',
        './node_modules/.pnpm/postcss@*/node_modules/postcss/**/*',
      ],
    },
  },
};

export default nextConfig;
```

Alternatively, move `tailwindcss` and `postcss` from `devDependencies` to
`dependencies` in your app's `package.json` — nft only traces from
`dependencies` by default, so promoting them is enough for `tailwindcss` /
`postcss` even without the trace-include globs.

### Verifying the build before shipping

```bash
pnpm next build
node .next/standalone/server.js &
curl -i http://localhost:3000/api/invoice
```

A working build gives `200 OK`, `Content-Type: application/pdf`, and bytes
starting with `%PDF-`. Anything else means the trace dropped something — re-run
`next build` with `--debug` and grep stderr for `Cannot find module`.

## `imprint.config.ts` in Next.js projects

```ts
// imprint.config.ts (project root)
import { defineConfig } from '@imprint-pdf/core/config';

export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
  // tailwind.stylesheet is auto-detected from app/globals.css, src/app.css, …
});
```

The `withImprint` plugin auto-detects `imprint.config.ts` in the project root.
