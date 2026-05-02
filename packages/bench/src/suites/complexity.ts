/**
 * Complexity suite — Imprint rendering the ReportDoc fixture at increasing
 * page counts (1, 5, 10, 25, 50) to show how render time scales with
 * document size.
 */

import { renderToBuffer } from '@imprint/react';
import React from 'react';
import { ReportDoc } from '../fixtures/report.js';
import { type BenchResult, bench } from '../runner.js';

const PAGE_COUNTS = [1, 5, 10, 25, 50] as const;

export async function runComplexity(runs: number, warmup: number): Promise<BenchResult[]> {
  const results: BenchResult[] = [];

  for (const n of PAGE_COUNTS) {
    results.push(
      await bench(
        `Imprint ${n}p`,
        () => renderToBuffer(React.createElement(ReportDoc, { pages: n })),
        runs,
        warmup,
      ),
    );
  }

  return results;
}
