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

React 18 and 19 — both reconciler majors are bundled.

`@imprint-pdf/cli` is a dev dependency. It backs `npx imprint dev`,
`npx imprint render`, and `npx imprint validate`. The runtime packages go in
your production bundle.

## Framework adapter

Pick the matching one.

```bash
# Next.js (App Router or Pages, any runtime)
pnpm add @imprint-pdf/next

# Vite (SPA, SSR via Vike, Astro)
pnpm add -D @imprint-pdf/vite
```

Cloudflare Workers and Bun import `@imprint-pdf/react` directly — no adapter
package needed. See [Cloudflare](frameworks/cloudflare.md) and
[Bun](frameworks/bun.md).

## Tailwind

```bash
# Tailwind v4 (recommended)
pnpm add tailwindcss

# Tailwind v3
pnpm add tailwindcss@^3 postcss
```

imprint-pdf reads `tailwindcss/package.json` to detect your version, then
dispatches. v3 configs (`tailwind.config.ts`) run through the classic PostCSS
plugin; v4 (CSS-first via `@theme`) runs through Oxide. See
[Tailwind config](integrations/tailwind-config.md) for precedence.

## Optional add-ons

Apache-2.0 like the rest. Install only what you need — the core packages render
full invoices and reports without any of these.

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

Detects your framework, writes `imprint.config.ts`, wires the plugin into
`next.config` or `vite.config`, scaffolds a template + route, and prints the
next command.

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
Vercel), wrap `next.config` with `withImprint()` from
`@imprint-pdf/next/plugin`. Otherwise nft drops `react-reconciler`,
`tailwindcss`, and `postcss`, and your deployed route fails with
`Cannot find module 'react-reconciler-18'` or `'tailwindcss'`. See
[Next.js standalone deployments](frameworks/nextjs.md#standalone-deployments).

## Next

- [Quick start](quick-start.md)
- [Concepts](concepts.md)
