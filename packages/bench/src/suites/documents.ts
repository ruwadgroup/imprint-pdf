/**
 * Documents suite — renders every fixture in the shared `@imprint-pdf/fixtures`
 * corpus once per run, so benchmark coverage grows automatically as documents
 * are added to the corpus.
 */

import { documents } from '@imprint-pdf/fixtures';
import { renderToBuffer } from '@imprint-pdf/react';
import { type BenchResult, bench } from '../runner.js';

export async function runDocuments(runs: number, warmup: number): Promise<BenchResult[]> {
  const results: BenchResult[] = [];
  for (const doc of documents) {
    results.push(await bench(doc.title, () => renderToBuffer(doc.render()), runs, warmup));
  }
  return results;
}
