import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { rasterize } from './rasterize.js';

export interface MatchOptions {
  page?: number;
  dpi?: number;
  // 0–1 fraction of pixels allowed to differ. 0.005 absorbs Poppler's
  // sub-pixel font jitter without hiding real layout regressions.
  tolerance?: number;
  threshold?: number;
  snapshotPath?: string;
  update?: boolean;
}

export interface MatchResult {
  pass: boolean;
  message: string;
  written?: boolean;
  diffPixels: number;
  totalPixels: number;
  ratio: number;
  snapshotPath: string;
}

export function matchPdfSnapshot(pdf: Uint8Array, opts: MatchOptions): MatchResult {
  const { snapshotPath } = opts;
  if (!snapshotPath) {
    throw new Error(
      'matchPdfSnapshot: snapshotPath is required. The Vitest/Jest adapters fill this in automatically from the current test path.',
    );
  }

  const tolerance = opts.tolerance ?? 0.005;
  const threshold = opts.threshold ?? 0.1;
  const update = opts.update ?? process.env.UPDATE_PDF_SNAPSHOTS === '1';
  const rasterized = rasterize(pdf, {
    ...(opts.page !== undefined && { page: opts.page }),
    ...(opts.dpi !== undefined && { dpi: opts.dpi }),
  });

  // First run / `--update-snapshots`: the rasterization is the baseline.
  // Mirrors how Vitest/Jest treat a missing `.snap` as write-and-pass.
  if (update || !existsSync(snapshotPath)) {
    const existed = existsSync(snapshotPath);
    mkdirSync(dirname(snapshotPath), { recursive: true });
    writeFileSync(snapshotPath, rasterized);
    return {
      pass: true,
      message: existed
        ? `Updated PDF snapshot: ${snapshotPath}`
        : `Wrote new PDF snapshot: ${snapshotPath}`,
      written: true,
      diffPixels: 0,
      totalPixels: 0,
      ratio: 0,
      snapshotPath,
    };
  }

  const actual = PNG.sync.read(rasterized);
  const baseline = PNG.sync.read(readFileSync(snapshotPath));

  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    const actualPath = `${snapshotPath.replace(/\.png$/, '')}.actual.png`;
    writeFileSync(actualPath, rasterized);
    return {
      pass: false,
      message:
        `PDF snapshot size mismatch: rasterized ${actual.width}×${actual.height} vs baseline ${baseline.width}×${baseline.height}.\n` +
        `Wrote actual to ${actualPath}. If intentional, re-run with UPDATE_PDF_SNAPSHOTS=1.`,
      diffPixels: -1,
      totalPixels: actual.width * actual.height,
      ratio: 1,
      snapshotPath,
    };
  }

  const totalPixels = actual.width * actual.height;
  const diff = new PNG({ width: actual.width, height: actual.height });
  const diffPixels = pixelmatch(
    actual.data,
    baseline.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold },
  );
  const ratio = totalPixels === 0 ? 0 : diffPixels / totalPixels;
  const pass = ratio <= tolerance;

  if (!pass) {
    const actualPath = `${snapshotPath.replace(/\.png$/, '')}.actual.png`;
    const diffPath = `${snapshotPath.replace(/\.png$/, '')}.diff.png`;
    writeFileSync(actualPath, rasterized);
    writeFileSync(diffPath, PNG.sync.write(diff));
    return {
      pass: false,
      message:
        `PDF visual diff ${(ratio * 100).toFixed(3)}% (${diffPixels} px) exceeds tolerance ${(tolerance * 100).toFixed(2)}%.\n` +
        `  baseline: ${snapshotPath}\n` +
        `  actual:   ${actualPath}\n` +
        `  diff:     ${diffPath}\n` +
        'If intentional, re-run with UPDATE_PDF_SNAPSHOTS=1.',
      diffPixels,
      totalPixels,
      ratio,
      snapshotPath,
    };
  }

  return {
    pass: true,
    message: `PDF snapshot matched (${diffPixels}/${totalPixels} px, ${(ratio * 100).toFixed(3)}%).`,
    diffPixels,
    totalPixels,
    ratio,
    snapshotPath,
  };
}

// `__pdf_snapshots__/<name>.png` mirrors Vitest/Jest's `__snapshots__`
// convention so baselines live next to the test that produced them.
export function resolveSnapshotPath(testPath: string, name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9_-]+/g, '-');
  return join(dirname(testPath), '__pdf_snapshots__', `${safe}.png`);
}
