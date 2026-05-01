import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface RasterizeOptions {
  page?: number;
  dpi?: number;
}

// Shells out to Poppler's pdftoppm rather than bundling a wasm rasterizer:
// CI images already have it, and wasm rasterizers diverge from real PDF
// viewer output — which defeats the point of visual regression.
export function rasterize(pdf: Uint8Array, opts: RasterizeOptions = {}): Buffer {
  const page = opts.page ?? 1;
  const dpi = opts.dpi ?? 110;
  const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpPdf = join(tmpdir(), `imprint-snap-${stamp}.pdf`);
  const tmpOut = join(tmpdir(), `imprint-snap-${stamp}`);
  writeFileSync(tmpPdf, pdf);
  try {
    execFileSync(
      'pdftoppm',
      ['-r', String(dpi), '-f', String(page), '-l', String(page), '-png', tmpPdf, tmpOut],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    // pdftoppm zero-pads the suffix to the page-count width — single page
    // → `-1`, 10–99 → `-01`, 100+ → `-001`.
    const candidates = [
      `${tmpOut}-${page}.png`,
      `${tmpOut}-${String(page).padStart(2, '0')}.png`,
      `${tmpOut}-${String(page).padStart(3, '0')}.png`,
    ];
    for (const c of candidates) if (existsSync(c)) return readFileSync(c);
    throw new Error(`pdftoppm produced no output for page ${page}`);
  } finally {
    try {
      unlinkSync(tmpPdf);
      for (const suf of ['-1', '-01', '-001']) {
        const f = `${tmpOut}${suf}.png`;
        if (existsSync(f)) unlinkSync(f);
      }
    } catch {}
  }
}

export function isPdftoppmAvailable(): boolean {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
