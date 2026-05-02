/**
 * Benchmarking harness: warmup iterations, wall-clock measurements, and
 * percentile statistics. Callers receive raw samples alongside derived
 * Stats so reporters can present whatever granularity they need.
 */

export interface Stats {
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface BenchResult {
  name: string;
  /** Size of the last rendered output in bytes. */
  bytes: number;
  /** Raw wall-clock measurements in milliseconds (length === runs). */
  samples: number[];
  stats: Stats;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]!;
}

function computeStats(samples: number[]): Stats {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    mean: sum / sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

/**
 * Runs `fn` for `warmup` iterations (results discarded), then `runs`
 * iterations measured by wall-clock time via `performance.now()`.
 *
 * Returns a {@link BenchResult} with the sorted percentile stats and the
 * byte length of the last return value so reporters can display output size.
 */
export async function bench(
  name: string,
  fn: () => Promise<Uint8Array | Buffer>,
  runs: number,
  warmup: number,
): Promise<BenchResult> {
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  const samples: number[] = [];
  let lastOutput: Uint8Array | Buffer = new Uint8Array(0);

  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    lastOutput = await fn();
    const t1 = performance.now();
    samples.push(t1 - t0);
  }

  return {
    name,
    bytes: lastOutput.length,
    samples,
    stats: computeStats(samples),
  };
}
