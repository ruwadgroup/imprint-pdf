// Bench / verify harness for the Cloudflare Worker example.
//
// Usage:
//   tsx scripts/bench.ts <url>                       1 cold + 20 warm
//   tsx scripts/bench.ts <url> --cold-runs 5         5 cold (eviction wait between)
//   tsx scripts/bench.ts <url> --max-cold-ms 100     exit 1 if any cold sample > N ms
//   tsx scripts/bench.ts <url> --out results.json    write machine-readable results
//
// Env equivalents: BENCH_RUNS, BENCH_COLD_RUNS, BENCH_COLD_GAP_SEC,
//                  BENCH_MAX_COLD_MS, BENCH_OUT.

import { writeFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

interface Args {
  url: string;
  warmRuns: number;
  coldRuns: number;
  coldGapMs: number;
  maxColdMs: number | null;
  outPath: string | null;
}

interface Sample {
  status: number;
  bytes: number;
  ms: number;
}

interface Stats {
  count: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

interface Results {
  url: string;
  startedAt: string;
  finishedAt: string;
  warm: Stats;
  cold: { samples: number[]; stats: Stats };
  threshold?: { maxColdMs: number; coldOverThreshold: number; pass: boolean };
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next != null && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(a);
    }
  }

  const url = positional[0] ?? 'http://localhost:8787';
  const warmRuns = Number(flags['warm-runs'] ?? process.env.BENCH_RUNS ?? 20);
  const coldRuns = Number(flags['cold-runs'] ?? process.env.BENCH_COLD_RUNS ?? 1);
  const coldGapMs =
    Number(flags['cold-gap-sec'] ?? process.env.BENCH_COLD_GAP_SEC ?? 30) * 1000;
  const maxColdRaw = flags['max-cold-ms'] ?? process.env.BENCH_MAX_COLD_MS;
  const maxColdMs = maxColdRaw == null ? null : Number(maxColdRaw);
  const outPath = flags.out ?? process.env.BENCH_OUT ?? null;

  return { url, warmRuns, coldRuns, coldGapMs, maxColdMs, outPath };
}

async function hit(url: string): Promise<Sample> {
  const start = performance.now();
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}id=BENCH-${Date.now()}`);
  const buf = await res.arrayBuffer();
  return { status: res.status, bytes: buf.byteLength, ms: performance.now() - start };
}

function statsOf(xs: number[]): Stats {
  if (xs.length === 0) {
    return { count: 0, mean: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }
  const sorted = [...xs].sort((a, b) => a - b);
  const p = (q: number): number =>
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]!;
  const mean = sorted.reduce((s, n) => s + n, 0) / sorted.length;
  return {
    count: sorted.length,
    mean,
    p50: p(0.5),
    p95: p(0.95),
    p99: p(0.99),
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
  };
}

function fmt(n: number): string {
  return n.toFixed(1);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log(
    `bench → ${args.url}\n` +
      `  cold-runs=${args.coldRuns} (gap ${args.coldGapMs / 1000}s)  warm-runs=${args.warmRuns}` +
      (args.maxColdMs != null ? `  max-cold-ms=${args.maxColdMs}` : ''),
  );

  const startedAt = new Date().toISOString();
  const coldSamples: number[] = [];

  for (let i = 0; i < args.coldRuns; i++) {
    if (i > 0) {
      console.log(`  waiting ${args.coldGapMs / 1000}s for isolate eviction…`);
      await new Promise((r) => setTimeout(r, args.coldGapMs));
    }
    const s = await hit(args.url);
    coldSamples.push(s.ms);
    console.log(
      `  cold[${i + 1}/${args.coldRuns}]: ${fmt(s.ms)}ms · ${s.bytes} bytes · status ${s.status}`,
    );
  }

  const warmSamples: number[] = [];
  for (let i = 0; i < args.warmRuns; i++) {
    const s = await hit(args.url);
    warmSamples.push(s.ms);
  }
  const warmStats = statsOf(warmSamples);
  console.log(
    `  warm: mean ${fmt(warmStats.mean)}ms · p50 ${fmt(warmStats.p50)}ms · p95 ${fmt(warmStats.p95)}ms · p99 ${fmt(warmStats.p99)}ms · min ${fmt(warmStats.min)}ms · max ${fmt(warmStats.max)}ms`,
  );

  const coldStats = statsOf(coldSamples);
  if (coldStats.count > 1) {
    console.log(
      `  cold: p50 ${fmt(coldStats.p50)}ms · p95 ${fmt(coldStats.p95)}ms · p99 ${fmt(coldStats.p99)}ms · min ${fmt(coldStats.min)}ms · max ${fmt(coldStats.max)}ms`,
    );
  }

  const results: Results = {
    url: args.url,
    startedAt,
    finishedAt: new Date().toISOString(),
    warm: warmStats,
    cold: { samples: coldSamples, stats: coldStats },
  };

  let pass = true;
  if (args.maxColdMs != null) {
    const over = coldSamples.filter((ms) => ms > args.maxColdMs!).length;
    pass = over === 0;
    results.threshold = { maxColdMs: args.maxColdMs, coldOverThreshold: over, pass };
    if (pass) {
      console.log(
        `  ✓ all ${coldSamples.length} cold samples ≤ ${args.maxColdMs}ms (max ${fmt(coldStats.max)}ms)`,
      );
    } else {
      console.error(
        `  ✗ ${over}/${coldSamples.length} cold samples exceed ${args.maxColdMs}ms (max ${fmt(coldStats.max)}ms)`,
      );
    }
  }

  if (args.outPath != null) {
    const abs = resolvePath(args.outPath);
    writeFileSync(abs, `${JSON.stringify(results, null, 2)}\n`);
    console.log(`  wrote ${abs}`);
  }

  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
