// Usage: pnpm tsx scripts/bench.ts <url>   — defaults to wrangler dev.
//        BENCH_COLD=true to wait through the isolate-eviction window.
//        BENCH_RUNS=<n> to change the warm-sample count.

const BASE = process.argv[2] ?? 'http://localhost:8787';
const WARMUP_GAP_MS = 30_000;
const RUNS = Number(process.env.BENCH_RUNS ?? 20);

interface Sample {
  status: number;
  bytes: number;
  ms: number;
}

async function hit(): Promise<Sample> {
  const start = performance.now();
  const res = await fetch(`${BASE}/?id=BENCH-${Date.now()}`);
  const buf = await res.arrayBuffer();
  return { status: res.status, bytes: buf.byteLength, ms: performance.now() - start };
}

function stats(xs: number[]) {
  const sorted = [...xs].sort((a, b) => a - b);
  const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]!;
  const mean = sorted.reduce((s, n) => s + n, 0) / sorted.length;
  return { mean, p50: p(0.5), p95: p(0.95), p99: p(0.99), min: sorted[0]!, max: sorted.at(-1)! };
}

async function main() {
  console.log(`bench → ${BASE} (${RUNS} runs)`);
  const cold = await hit();
  console.log(`cold:  ${cold.ms.toFixed(1)}ms · ${cold.bytes} bytes · status ${cold.status}`);

  const warm: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const s = await hit();
    warm.push(s.ms);
  }
  const w = stats(warm);
  console.log(
    `warm:  mean ${w.mean.toFixed(1)}ms · p50 ${w.p50.toFixed(1)}ms · ` +
      `p95 ${w.p95.toFixed(1)}ms · p99 ${w.p99.toFixed(1)}ms · ` +
      `min ${w.min.toFixed(1)}ms · max ${w.max.toFixed(1)}ms`,
  );

  if (process.env.BENCH_COLD === 'true') {
    console.log(`waiting ${WARMUP_GAP_MS / 1000}s for isolate eviction…`);
    await new Promise((r) => setTimeout(r, WARMUP_GAP_MS));
    const cold2 = await hit();
    console.log(`cold²: ${cold2.ms.toFixed(1)}ms (after eviction window)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
