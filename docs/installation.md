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

No dedicated package. `@imprint/react` works natively with Bun's WASM
support — see the [Bun guide](frameworks/bun.md).

## Tailwind

```bash
pnpm add -D @imprint/tailwind tailwindcss
```

## Optional enterprise packages

These are [BSL-licensed](../LICENSING.md). A commercial license is required for
production use.

| Package          | Use it for                                            |
| ---------------- | ----------------------------------------------------- |
| `@imprint/print` | PDF/X-4, CMYK, ICC profiles, PDF/A, bleed/trim/marks  |
| `@imprint/sign`  | PKCS#7 detached digital signatures                    |
| `@imprint/ua`    | Tagged PDF / PDF/UA-1 accessibility                   |

```bash
pnpm add @imprint/print @imprint/sign @imprint/ua
```

## Optional tooling

| Package                    | Use it for                                         |
| -------------------------- | -------------------------------------------------- |
| `@imprint/eslint-plugin`   | Catch unsupported CSS and missing alt text at write time |

```bash
pnpm add -D @imprint/eslint-plugin
```

## Initialise

```bash
npx imprint init
```

Writes `imprint.config.ts` to your project root. Edit `fonts` and `tailwind`
for your project — see [Configuration](reference/configuration.md).

## Version matrix

| @imprint/\* | React | Next.js | Vite  | Tailwind CSS | Node  |
| ----------- | ----- | ------- | ----- | ------------ | ----- |
| 0.x         | ≥18   | ≥14     | ≥5    | ≥4.0         | ≥20   |

## Next

- [Quick start](quick-start.md)
- [Concepts](concepts.md)
