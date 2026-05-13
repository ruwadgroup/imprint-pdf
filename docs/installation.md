# Installation

## Requirements

- Node ≥ 20, Bun ≥ 1.0, Cloudflare Workers, or Vercel Edge
- React 18.2+ or 19.x
- Tailwind CSS v3.4+ or v4.x
- Any package manager — `pnpm`, `npm`, `yarn`, `bun`

## Core install

```bash
pnpm add @imprint-pdf/react @imprint-pdf/core tailwindcss
pnpm add -D @imprint-pdf/cli
```

Works on React 18 and 19 — both reconciler majors are bundled.

`@imprint-pdf/cli` is a dev dependency. It's what `npx imprint dev`,
`npx imprint render`, and `npx imprint validate` use. The runtime packages go
into your production bundle.

## Framework adapter

Pick the one that matches your setup.

```bash
# Next.js (App Router or Pages, any runtime)
pnpm add @imprint-pdf/next

# Vite (SPA, SSR via Vike, Astro)
pnpm add -D @imprint-pdf/vite
```

Cloudflare Workers and Bun don't need a dedicated package — they import
`@imprint-pdf/react/standalone` directly. See
[Cloudflare](frameworks/cloudflare.md) and [Bun](frameworks/bun.md).

## Tailwind

```bash
# Tailwind v4 (recommended)
pnpm add tailwindcss

# Tailwind v3
pnpm add tailwindcss@^3 postcss
```

imprint-pdf reads `tailwindcss/package.json` from your project to figure out
which version you're on, then dispatches accordingly. v3 configs
(`tailwind.config.ts`) run through the classic PostCSS plugin; v4 configs
(CSS-first via `@theme`) run through the Oxide compiler. See
[Tailwind config](integrations/tailwind-config.md) for the precedence ladder.

## Optional add-ons

Apache-2.0 like the rest. Install only what you actually need — the core
packages render full invoices and reports without any of these.

| Package              | What for                                             |
| -------------------- | ---------------------------------------------------- |
| `@imprint-pdf/print` | PDF/X-4, CMYK, ICC profiles, PDF/A, bleed/trim/marks |
| `@imprint-pdf/sign`  | PKCS#7 detached digital signatures                   |
| `@imprint-pdf/ua`    | Tagged PDF / PDF/UA-1 accessibility                  |

```bash
pnpm add @imprint-pdf/print @imprint-pdf/sign @imprint-pdf/ua
```

## Optional tooling

| Package               | What for                                                |
| --------------------- | ------------------------------------------------------- |
| `@imprint-pdf/eslint` | Catch unsupported CSS and missing alt text at lint time |

```bash
pnpm add -D @imprint-pdf/eslint
```

## Initialise

```bash
npx imprint init
```

Detects your framework, writes `imprint.config.ts`, wires the plugin into your
`next.config` or `vite.config`, scaffolds a template + route, and prints the
next command to run.

## Version matrix

| `@imprint-pdf/*` | React       | Next.js | Vite  | Tailwind  | Node |
| ---------------- | ----------- | ------- | ----- | --------- | ---- |
| 1.x              | 18.2 – 19.x | 14 – 16 | 5 – 7 | 3.4 – 4.x | ≥20  |

Current published alphas (under the `alpha` dist-tag):
`@imprint-pdf/core@1.0.0-alpha.10`, `@imprint-pdf/react@1.0.0-alpha.10`,
`@imprint-pdf/next@1.0.0-alpha.10`, `@imprint-pdf/fonts@1.0.0-alpha.6`. Pin
explicitly while pre-1.0.

## Deploying to production?

If your Next.js app uses `output: 'standalone'` (Docker, Coolify, self-hosted
Vercel), make sure your `next.config` uses `withImprint()` from
`@imprint-pdf/next/plugin` — otherwise nft drops `react-reconciler` /
`tailwindcss` / `postcss` and your deployed route fails with
`Cannot find module 'react-reconciler-18'` or `'tailwindcss'`. See the
[Next.js standalone deployments guide](frameworks/nextjs.md#standalone-deployments).

## Next

- [Quick start](quick-start.md)
- [Concepts](concepts.md)
