# Performance

All numbers on Apple Silicon M2 / Node 22 unless noted. Reproduce locally:

```bash
pnpm --filter @imprint-pdf/core bench
```

## Edge cold start

| Runtime              | Cold start (1-page A4 invoice) | Warm   |
| -------------------- | ------------------------------ | ------ |
| Cloudflare Worker    | ~60–100 ms                     | ~20 ms |
| Vercel Edge Function | ~80–120 ms                     | ~25 ms |
| AWS Lambda (Node)    | ~40–80 ms                      | ~15 ms |
| Node.js (local)      | ~30 ms                         | ~10 ms |
| Chromium (Puppeteer) | 800–2,000 ms                   | 300 ms |

Budget: **< 100 ms cold for a 1-page A4 invoice on Cloudflare**. Chromium is
10–20× slower.

WASM instantiation dominates cold start (~30–60 ms) — a fixed cost independent
of document complexity.

## Render throughput (warm)

| Document                               | Time   |
| -------------------------------------- | ------ |
| 1-page A4 invoice, 5 Tailwind classes  | ~10 ms |
| 1-page A4 invoice, 50 Tailwind classes | ~15 ms |
| 5-page report, Recharts vector chart   | ~35 ms |
| 20-page report with tables             | ~80 ms |

Typography dominates the cost on text-heavy documents. Knuth–Plass runs at ~1 ms
per paragraph.

## Bundle size (browser)

| Build target                                 | Gzipped  |
| -------------------------------------------- | -------- |
| `@imprint-pdf/react` default (Flex + Knuth)  | ~800 KB  |
| With CSS Grid (Taffy full build)             | ~850 KB  |
| With runtime Tailwind Oxide WASM fallback    | +~350 KB |
| `@imprint-pdf/react/standalone` (CF Workers) | ~750 KB  |

Tree-shaking drops unused feature flags. An invoice-only client using only
Flexbox without the Oxide fallback comes in around ~600 KB gzipped.

## Font subsetting

| Source font          | Characters used | Subset size |
| -------------------- | --------------- | ----------- |
| Inter (Latin)        | 256             | ~50 KB      |
| Noto Sans CJK (full) | 500             | ~80 KB      |
| Noto Sans CJK (full) | 5,000           | ~600 KB     |

Subsetting uses HarfBuzz's subsetter — only used glyphs are embedded. The full
12 MB font never lands in the PDF.

## Reproducing

```bash
# Renderer benchmarks
pnpm --filter @imprint-pdf/core bench

# Cold start on Workers (requires wrangler)
pnpm --filter @imprint-pdf/example-cloudflare-worker deploy --dry-run
```

## Methodology notes

- Times via `performance.now()` around `pdf(..., { as: 'bytes' })` (no Response
  wrapping). First run per process excluded (V8 warm-up); reported numbers are
  median of 100 runs on warm WASM.
- Cloudflare numbers from `wrangler dev --local` on Workers Unbound. Production
  edge varies ±20%.
- Gzip sizes via `gzip -9` of the production bundle.
