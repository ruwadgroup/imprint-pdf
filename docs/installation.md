# Installation

## Requirements

- Node.js ≥ 20 (or Bun ≥ 1.0, Cloudflare Workers, Vercel Edge)
- Any package manager — `pnpm`, `npm`, `yarn`, `bun`
- Tailwind CSS v4

## Core install

```bash
pnpm add @imprint/react @imprint/core
pnpm add -D @imprint/cli
```

`@imprint/cli` is a dev dependency — it runs when you develop locally or
validate in CI. The runtime packages go into your production bundle.

## Framework adapters

Install the one that matches your setup, alongside the core packages above.

### Next.js (App Router, Edge Runtime)

```bash
pnpm add @imprint/next
```

### Vite (SPA, SSR via Vike, Astro)

```bash
pnpm add -D @imprint/vite
```

### Cloudflare Workers / Vercel Edge

No dedicated package. Use `@imprint/react/standalone` — see the
[Cloudflare guide](frameworks/cloudflare.md).

### Bun

No dedicated package. `@imprint/react` works natively with Bun's WASM support —
see the [Bun guide](frameworks/bun.md).

## Tailwind

```bash
pnpm add -D @imprint/tailwind tailwindcss
```

## Optional enterprise packages

Apache-2.0 like the rest. Install only when you need the surface — the core
packages render full invoices and reports without them.

| Package          | Use it for                                           |
| ---------------- | ---------------------------------------------------- |
| `@imprint/print` | PDF/X-4, CMYK, ICC profiles, PDF/A, bleed/trim/marks |
| `@imprint/sign`  | PKCS#7 detached digital signatures                   |
| `@imprint/ua`    | Tagged PDF / PDF/UA-1 accessibility                  |

```bash
pnpm add @imprint/print @imprint/sign @imprint/ua
```

## Optional tooling

| Package           | Use it for                                               |
| ----------------- | -------------------------------------------------------- |
| `@imprint/eslint` | Catch unsupported CSS and missing alt text at write time |

```bash
pnpm add -D @imprint/eslint
```

## Initialise

```bash
npx imprint init
```

Writes a minimal `imprint.config.ts` to your project root. Imprint applies
sensible defaults — your Tailwind v4 stylesheet is auto-detected from
`src/app.css`, `src/globals.css`, `app/globals.css`, and similar conventional
locations, and `outDir` defaults to `out`. Add a `fonts` entry once you have
fonts to embed. See [Configuration](reference/configuration.md) for the full
surface.

## Version matrix

| @imprint/\* | React | Next.js | Vite | Tailwind CSS | Node |
| ----------- | ----- | ------- | ---- | ------------ | ---- |
| 0.x         | ≥18   | ≥14     | ≥5   | ≥4.0         | ≥20  |

## Next

- [Quick start](quick-start.md)
- [Concepts](concepts.md)
