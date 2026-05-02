/**
 * @imprint-pdf/bench — CLI entry point
 *
 * Usage:
 *   pnpm bench                          run all suites
 *   pnpm bench --suite competitors
 *   pnpm bench --suite complexity
 *   pnpm bench --suite pipeline
 *   pnpm bench --suite features
 *   pnpm bench --runs 50 --warmup 5
 *   pnpm bench --out results.json
 */

import { printTable, writeJson } from './reporter.js';
import type { BenchResult } from './runner.js';
import { runChromium } from './suites/chromium.js';
import { runCompetitors } from './suites/competitors.js';
import { runComplexity } from './suites/complexity.js';
import { runFeatures } from './suites/features.js';
import { runPipeline } from './suites/pipeline.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';

function flag(name: string): string | undefined {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined;
}

function flagNum(name: string, fallback: number): number {
  const v = flag(name);
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const SUITE = flag('suite');
const RUNS = flagNum('runs', 30);
const WARMUP = flagNum('warmup', 5);
const OUT = flag('out');

const BASELINES: Record<string, string> = {
  competitors: 'imprint-pdf',
  complexity: 'imprint-pdf 1p',
  pipeline: 'core',
  features: 'mixed',
  chromium: 'chromium (warm)',
};

type SuiteRunner = (runs: number, warmup: number) => Promise<BenchResult[]>;

const SUITES: Record<string, { label: string; run: SuiteRunner }> = {
  competitors: { label: 'Competitors — same invoice', run: runCompetitors },
  complexity: { label: 'Complexity — page count scaling', run: runComplexity },
  pipeline: { label: 'Pipeline — cumulative hook cost', run: runPipeline },
  features: { label: 'Features — rendering path comparison', run: runFeatures },
  chromium: { label: 'Chromium — Puppeteer (warm + cold)', run: runChromium },
};

// Default run skips chromium — it dwarfs the JS suites and downloads a
// 200 MB binary. Opt in with `--suite chromium` or `--suite all`.
const DEFAULT_SUITES = ['competitors', 'complexity', 'pipeline', 'features'];

async function main(): Promise<void> {
  const suiteNames =
    SUITE === undefined
      ? DEFAULT_SUITES
      : SUITE === 'all'
        ? (Object.keys(SUITES) as Array<keyof typeof SUITES>)
        : [SUITE];

  const allResults: Record<string, BenchResult[]> = {};

  console.log(
    `\n${BOLD}${CYAN}imprint-pdf Benchmark Suite${RESET}  ` +
      `runs=${RUNS}  warmup=${WARMUP}` +
      (SUITE ? `  suite=${SUITE}` : ''),
  );

  for (const name of suiteNames) {
    const entry = SUITES[name];
    if (!entry) {
      console.error(`Unknown suite "${name}". Available: ${Object.keys(SUITES).join(', ')}`);
      process.exit(1);
    }

    console.log(`\n${BOLD}── ${entry.label}${RESET}`);
    const results = await entry.run(RUNS, WARMUP);
    printTable(results, BASELINES[name]);
    allResults[name] = results;
  }

  if (OUT !== undefined) {
    const payload = {
      meta: { date: new Date().toISOString(), runs: RUNS, warmup: WARMUP },
      suites: allResults,
    };
    writeJson(OUT, payload);
    console.log(`Results written to ${OUT}\n`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
