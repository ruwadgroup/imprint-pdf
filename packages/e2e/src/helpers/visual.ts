import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PIXMAP_DIR = resolve(HERE, '..', '..', '__pixmaps__');

/** UPDATE_GOLDENS=1 overwrites baselines on intentional render changes. */
const UPDATE = process.env.UPDATE_GOLDENS === '1';

interface RasterizeOptions {
  page?: number;
  dpi?: number;
}

function rasterize(pdf: Uint8Array, opts: RasterizeOptions = {}): Buffer {
  const page = opts.page ?? 1;
  const dpi = opts.dpi ?? 110;
  const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpPdf = join(tmpdir(), `imprint-e2e-${stamp}.pdf`);
  const tmpOut = join(tmpdir(), `imprint-e2e-${stamp}`);
  writeFileSync(tmpPdf, pdf);
  try {
    execFileSync(
      'pdftoppm',
      ['-r', String(dpi), '-f', String(page), '-l', String(page), '-png', tmpPdf, tmpOut],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    // pdftoppm zero-pads the page suffix to match the document's page count
    // width. We render single pages, so check both `-1` and `-01` forms.
    const candidates = [`${tmpOut}-1.png`, `${tmpOut}-01.png`];
    for (const c of candidates) if (existsSync(c)) return readFileSync(c);
    throw new Error(`pdftoppm output not found for page ${page}`);
  } finally {
    try {
      execFileSync('rm', ['-f', tmpPdf, `${tmpOut}-1.png`, `${tmpOut}-01.png`]);
    } catch {}
  }
}

export interface VisualMatchResult {
  diffPixels: number;
  totalPixels: number;
  ratio: number;
}

/** Throws when the diff exceeds tolerance (default 0.5% of total pixels). */
export async function expectVisualMatch(
  pdf: Uint8Array,
  name: string,
  options: RasterizeOptions & { tolerance?: number } = {},
): Promise<VisualMatchResult> {
  if (!existsSync(PIXMAP_DIR)) mkdirSync(PIXMAP_DIR, { recursive: true });
  const goldenPath = join(PIXMAP_DIR, `${name}.png`);

  const buf = rasterize(pdf, options);

  if (UPDATE || !existsSync(goldenPath)) {
    writeFileSync(goldenPath, buf);
    return { diffPixels: 0, totalPixels: 0, ratio: 0 };
  }

  const actual = PNG.sync.read(buf);
  const golden = PNG.sync.read(readFileSync(goldenPath));

  if (actual.width !== golden.width || actual.height !== golden.height) {
    const failPath = join(PIXMAP_DIR, `${name}.actual.png`);
    writeFileSync(failPath, buf);
    throw new Error(
      `[${name}] Rasterized size ${actual.width}×${actual.height} != golden ${golden.width}×${golden.height}. ` +
        `Wrote actual to ${failPath}. If intentional, run UPDATE_GOLDENS=1.`,
    );
  }

  const totalPixels = actual.width * actual.height;
  const diff = new PNG({ width: actual.width, height: actual.height });
  const diffPixels = pixelmatch(actual.data, golden.data, diff.data, actual.width, actual.height, {
    threshold: 0.1,
  });
  const ratio = diffPixels / totalPixels;
  const tolerance = options.tolerance ?? 0.005;

  if (ratio > tolerance) {
    const actualPath = join(PIXMAP_DIR, `${name}.actual.png`);
    const diffPath = join(PIXMAP_DIR, `${name}.diff.png`);
    writeFileSync(actualPath, buf);
    writeFileSync(diffPath, PNG.sync.write(diff));
    throw new Error(
      `[${name}] Visual diff ${(ratio * 100).toFixed(3)}% (${diffPixels} px) ` +
        `exceeds tolerance ${(tolerance * 100).toFixed(2)}%. ` +
        `Compare ${goldenPath} vs ${actualPath} (diff: ${diffPath}). ` +
        `If intentional, run UPDATE_GOLDENS=1.`,
    );
  }

  return { diffPixels, totalPixels, ratio };
}

export function isPdftoppmAvailable(): boolean {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
