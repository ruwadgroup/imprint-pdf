# example — next-app

Next.js 15 App Router demo for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf).

```bash
pnpm --filter @imprint-pdf/example-next-app dev
```

## What's demonstrated

- **`app/api/invoice/[id]/route.ts`** — App Router route handler that renders an
  `<Invoice>` component to a PDF and streams the bytes back.
- **`app/api/invoice/[id]/route.ts` (Edge variant)** — same route with
  `export const runtime = 'edge'` using the standalone WASM build.
- **`components/Invoice.tsx`** — a real-looking invoice with Tailwind classes,
  `<Chart>` (Recharts → vector), and a `<Signature>` widget.
- **`components/Report.tsx`** — multi-page financial report with running headers
  and a `<table>`.
- **`next.config.ts`** — `withImprint()` plugin wiring.
- **`app/globals.css`** — Tailwind v4 stylesheet with shared `@theme` design
  tokens (consumed by both the app and imprint-pdf).

## Structure

```
examples/next-app/
├── app/
│   ├── api/
│   │   └── invoice/[id]/
│   │       └── route.ts
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── Invoice.tsx
│   └── Report.tsx
├── public/fonts/
├── imprint.config.ts
└── next.config.ts
```
