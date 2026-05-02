# example — cloudflare-worker

Cloudflare Worker demo for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Renders a
tailwind-styled PDF receipt on the edge.

```bash
pnpm --filter @imprint-pdf/example-cloudflare-worker dev
# → http://localhost:8787

pnpm --filter @imprint-pdf/example-cloudflare-worker deploy
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
pnpm --filter @imprint-pdf/example-cloudflare-worker bench http://localhost:8787

# Deployed (1 cold + 20 warm):
pnpm --filter @imprint-pdf/example-cloudflare-worker bench \
  https://imprint-cloudflare-worker.<account>.workers.dev

# More cold samples (waits through the eviction window between each):
pnpm --filter @imprint-pdf/example-cloudflare-worker bench <url> --cold-runs 5

# CI / verification: fail non-zero if any cold sample exceeds N ms,
# write machine-readable results to bench-results.json:
pnpm --filter @imprint-pdf/example-cloudflare-worker bench:verify <url>
```

`bench:verify` runs `--cold-runs 5 --max-cold-ms 100 --out bench-results.json`.
That's the harness the roadmap "sub-100 ms cold benchmark verified on a real
deploy" item gates on — run it once against your deployed Worker and commit the
results JSON as evidence.

Flags:

| Flag                 | Default | Description                                    |
| -------------------- | ------- | ---------------------------------------------- |
| `--warm-runs <N>`    | `20`    | Warm-up sample count.                          |
| `--cold-runs <N>`    | `1`     | Cold-start sample count.                       |
| `--cold-gap-sec <N>` | `30`    | Eviction wait between cold samples (s).        |
| `--max-cold-ms <N>`  | off     | Exit non-zero if any cold sample exceeds N ms. |
| `--out <path>`       | off     | Write `Results` JSON to path.                  |

Each flag has a `BENCH_*` env equivalent (`BENCH_RUNS`, `BENCH_COLD_RUNS`,
`BENCH_COLD_GAP_SEC`, `BENCH_MAX_COLD_MS`, `BENCH_OUT`).

Cold-start depends on whether Cloudflare keeps your isolate hot and is outside
your direct control beyond keeping the bundle small.

## Notes

- `compatibility_flags = ["nodejs_compat"]` is required — pdf-lib uses `Buffer`
  and a small handful of other Node built-ins.
- The standalone build (`@imprint-pdf/react/standalone`) is currently a thin
  re-export of `@imprint-pdf/react`. The dedicated WASM-bundled standalone path
  arrives with the `@imprint-pdf/print` enterprise tier.
