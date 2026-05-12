# Installation

## Requirements

- Node.js ≥ 20 (or Bun ≥ 1.0, Cloudflare Workers, Vercel Edge)
- Any package manager — `pnpm`, `npm`, `yarn`, `bun`
- React 18.2+ or 19.x
- Tailwind CSS v3.4+ or v4.x

## Core install

```bash
pnpm add @imprint-pdf/react @imprint-pdf/core
pnpm add -D @imprint-pdf/cli
```

That's it on both React 18 and React 19. `@imprint-pdf/react` bundles **both**
`react-reconciler@^0.29` (React 18) and `^0.33` (React 19) under aliased package
names and picks the matching one at module load by reading `React.version`. You
don't install a separate reconciler.

`@imprint-pdf/cli` is a dev dependency — it runs when you develop locally or
validate in CI. The runtime packages go into your production bundle.

## Framework adapters

Install the one that matches your setup, alongside the core packages above.

### Next.js (App Router, Edge Runtime)

```bash
pnpm add @imprint-pdf/next
```

### Vite (SPA, SSR via Vike, Astro)

```bash
pnpm add -D @imprint-pdf/vite
```

### Cloudflare Workers / Vercel Edge

No dedicated package. Use `@imprint-pdf/react/standalone` — see the
[Cloudflare guide](frameworks/cloudflare.md).

### Bun

No dedicated package. `@imprint-pdf/react` works natively with Bun's WASM
support — see the [Bun guide](frameworks/bun.md).

## Tailwind

```bash
# Tailwind v4 (recommended)
pnpm add -D @imprint-pdf/tailwind tailwindcss@^4

# Tailwind v3 (also supported)
pnpm add -D @imprint-pdf/tailwind tailwindcss@^3 postcss
```

imprint-pdf auto-detects whether you're on v3 or v4 by reading
`tailwindcss/package.json` from your project. v3 configs (`tailwind.config.ts`)
run through the classic PostCSS plugin; v4 configs (CSS-first via `@theme`) run
through the new `tw.compile()` API. See
[Tailwind config](integrations/tailwind-config.md) for the precedence rules.

## Optional add-on packages

Apache-2.0 like the rest. Install only when you need the surface — the core
packages render full invoices and reports without them.

| Package              | Use it for                                           |
| -------------------- | ---------------------------------------------------- |
| `@imprint-pdf/print` | PDF/X-4, CMYK, ICC profiles, PDF/A, bleed/trim/marks |
| `@imprint-pdf/sign`  | PKCS#7 detached digital signatures                   |
| `@imprint-pdf/ua`    | Tagged PDF / PDF/UA-1 accessibility                  |

```bash
pnpm add @imprint-pdf/print @imprint-pdf/sign @imprint-pdf/ua
```

## Optional tooling

| Package               | Use it for                                               |
| --------------------- | -------------------------------------------------------- |
| `@imprint-pdf/eslint` | Catch unsupported CSS and missing alt text at write time |

```bash
pnpm add -D @imprint-pdf/eslint
```

## Initialise

```bash
npx imprint init
```

Writes a minimal `imprint.config.ts` to your project root. imprint-pdf applies
sensible defaults — your Tailwind v4 stylesheet is auto-detected from
`src/app.css`, `src/globals.css`, `app/globals.css`, and similar conventional
locations, and `outDir` defaults to `out`. Add a `fonts` entry once you have
fonts to embed. See [Configuration](reference/configuration.md) for the full
surface.

## Version matrix

| @imprint-pdf/\* | React       | react-reconciler                       | Next.js | Vite  | Tailwind CSS | Node |
| --------------- | ----------- | -------------------------------------- | ------- | ----- | ------------ | ---- |
| 1.x             | 18.2 – 19.x | bundled (^0.29 for R18, ^0.33 for R19) | 14 – 16 | 5 – 7 | 3.4 – 4.x    | ≥20  |

## Next

- [Quick start](quick-start.md)
- [Concepts](concepts.md)
