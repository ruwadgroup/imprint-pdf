# example — react18-tailwind3-nextjs

Compatibility smoke test for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf) on React 18 +
Tailwind CSS v3 + Next.js 14 (App Router). It confirms the React 18 reconciler
path and the Tailwind v3 PostCSS dispatch in `@imprint-pdf/tailwind` both render
a PDF on a stock Next.js setup.

```bash
pnpm --filter @imprint-pdf/example-react18-tailwind3-nextjs install
pnpm --filter @imprint-pdf/example-react18-tailwind3-nextjs dev
```

Or from this directory:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Render PDF** to
hit the route handler.

## What's demonstrated

- **`app/api/invoice/route.tsx`** — `nodejs` App Router route that renders an
  `<Invoice>` to a PDF and returns it as a `Response`, body kept to a one-liner.
- **`templates/invoice.tsx`** — the invoice component styled with Tailwind v3
  classes and the Inter Google font.
- **`app/page.tsx`** — minimal landing page linking to the render route.
- **`imprint.config.ts`** — fonts via `googleFont('Inter')` and Tailwind v3
  wiring through `tailwind.config.ts`.

## Versions pinned

- React `^18`, Next.js `14.2.35` (App Router)
- Tailwind CSS `^3.4.1`
- `@imprint-pdf/*` `1.0.0-alpha.10` (`@imprint-pdf/fonts` `1.0.0-alpha.6`)
