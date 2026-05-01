# example — cloudflare-worker

Cloudflare Worker demo for [Imprint](https://github.com/tamimbinhakim/imprint).
Renders a tailwind-styled PDF receipt on the edge.

```bash
pnpm --filter @imprint/example-cloudflare-worker dev
# → http://localhost:8787

pnpm --filter @imprint/example-cloudflare-worker deploy
# → https://imprint-cloudflare-worker.<account>.workers.dev
```

## Layout

```
examples/cloudflare-worker/
├── src/index.tsx       # Receipt component + fetch handler
├── scripts/bench.ts    # Latency benchmark
└── wrangler.toml       # Worker config (nodejs_compat enabled)
```

## Bench

```bash
# Local (wrangler dev must be running):
pnpm --filter @imprint/example-cloudflare-worker bench http://localhost:8787

# Deployed:
pnpm --filter @imprint/example-cloudflare-worker bench \
  https://imprint-cloudflare-worker.<account>.workers.dev

# Force a true cold start by waiting through the isolate-eviction window:
BENCH_COLD=true pnpm --filter @imprint/example-cloudflare-worker bench <url>
```

The bench reports cold + warm `p50 / p95 / p99`. The roadmap target is sub-100
ms warm; cold-start depends on whether Cloudflare keeps your isolate hot and is
outside your direct control beyond keeping the bundle small.

## Notes

- `compatibility_flags = ["nodejs_compat"]` is required — pdf-lib uses `Buffer`
  and a small handful of other Node built-ins.
- The standalone build (`@imprint/react/standalone`) is currently a thin
  re-export of `@imprint/react`. The dedicated WASM-bundled standalone path
  arrives with the `@imprint/print` enterprise tier.
