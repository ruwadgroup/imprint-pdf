/**
 * Console table reporter (ANSI colour) and JSON file sink for bench results.
 */

import { writeFileSync } from 'node:fs';
import type { BenchResult } from './runner.js';

// ANSI escape helpers — no external dependency needed.
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';

function col(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + ' '.repeat(width - s.length);
}

function ms(n: number): string {
  return n.toFixed(2);
}

function kb(bytes: number): string {
  return (bytes / 1024).toFixed(1);
}

function speedupColor(x: number): string {
  if (x >= 1.5) return GREEN;
  if (x >= 0.9) return CYAN;
  if (x >= 0.5) return YELLOW;
  return RED;
}

/**
 * Prints an ANSI-coloured table of benchmark results to stdout.
 *
 * Columns: name | mean ms | p50 | p95 | p99 | min | max | KB | speedup
 *
 * If `baseline` names one of the results, a "×N faster/slower" speedup
 * column is appended relative to that baseline's mean.
 */
export function printTable(results: BenchResult[], baseline?: string): void {
  const baseResult = baseline ? results.find((r) => r.name === baseline) : undefined;

  const COLS = {
    name: 28,
    mean: 9,
    p50: 9,
    p95: 9,
    p99: 9,
    min: 9,
    max: 9,
    kb: 8,
    speedup: 10,
  };

  const header =
    BOLD +
    col('name', COLS.name) +
    col('mean ms', COLS.mean) +
    col('p50', COLS.p50) +
    col('p95', COLS.p95) +
    col('p99', COLS.p99) +
    col('min', COLS.min) +
    col('max', COLS.max) +
    col('KB', COLS.kb) +
    (baseResult ? col('speedup', COLS.speedup) : '') +
    RESET;

  const divider = DIM + '─'.repeat(Object.values(COLS).reduce((a, b) => a + b, 0)) + RESET;

  console.log('');
  console.log(header);
  console.log(divider);

  for (const r of results) {
    const isBaseline = r.name === baseline;
    const speedupStr = baseResult
      ? isBaseline
        ? DIM + col('baseline', COLS.speedup) + RESET
        : (() => {
            const x = baseResult.stats.mean / r.stats.mean;
            const label = x >= 1 ? `${x.toFixed(2)}x faster` : `${(1 / x).toFixed(2)}x slower`;
            return speedupColor(x) + col(label, COLS.speedup) + RESET;
          })()
      : '';

    const nameStr = isBaseline
      ? BOLD + CYAN + col(r.name, COLS.name) + RESET
      : col(r.name, COLS.name);

    console.log(
      nameStr +
        col(ms(r.stats.mean), COLS.mean) +
        col(ms(r.stats.p50), COLS.p50) +
        col(ms(r.stats.p95), COLS.p95) +
        col(ms(r.stats.p99), COLS.p99) +
        col(ms(r.stats.min), COLS.min) +
        col(ms(r.stats.max), COLS.max) +
        col(kb(r.bytes), COLS.kb) +
        speedupStr,
    );
  }

  console.log(divider);
  console.log('');
}

/**
 * Serialises `data` as formatted JSON and writes it to `path`.
 * Any error is rethrown to the caller.
 */
export function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}
