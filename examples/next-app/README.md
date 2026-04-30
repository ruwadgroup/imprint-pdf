# example — next-app

Next.js 15 App Router demo for
[Imprint](https://github.com/tamimbinhakim/imprint).

```bash
pnpm --filter @imprint/example-next-app dev
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
- **`tailwind.config.ts`** — shared design tokens.

## Structure

```
examples/next-app/
├── app/
│   ├── api/
│   │   └── invoice/[id]/
│   │       └── route.ts
│   └── page.tsx
├── components/
│   ├── Invoice.tsx
│   └── Report.tsx
├── public/fonts/
├── imprint.config.ts
├── next.config.ts
└── tailwind.config.ts
```
