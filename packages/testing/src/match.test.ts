import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { matchPdfSnapshot, resolveSnapshotPath } from './match.js';
import * as rasterizeModule from './rasterize.js';

function solidPng(width: number, height: number, rgba: [number, number, number, number]): Buffer {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgba[0];
    png.data[i + 1] = rgba[1];
    png.data[i + 2] = rgba[2];
    png.data[i + 3] = rgba[3];
  }
  return PNG.sync.write(png);
}

const RED = solidPng(8, 8, [255, 0, 0, 255]);
const BLUE = solidPng(8, 8, [0, 0, 255, 255]);

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'imprint-testing-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('resolveSnapshotPath', () => {
  it('puts snapshots in __pdf_snapshots__ next to the test file', () => {
    expect(resolveSnapshotPath('/proj/tests/foo.test.ts', 'renders an invoice')).toBe(
      '/proj/tests/__pdf_snapshots__/renders-an-invoice.png',
    );
  });

  it('safe-encodes non-alphanumeric characters in the snapshot name', () => {
    expect(resolveSnapshotPath('/proj/foo.test.ts', 'page 1: header / footer')).toBe(
      '/proj/__pdf_snapshots__/page-1-header-footer.png',
    );
  });
});

describe('matchPdfSnapshot', () => {
  it('writes the baseline on first run and reports pass', () => {
    vi.spyOn(rasterizeModule, 'rasterize').mockReturnValue(RED);

    const snapshotPath = join(workDir, '__pdf_snapshots__', 'first.png');
    const result = matchPdfSnapshot(new Uint8Array([0x25, 0x50, 0x44, 0x46]), { snapshotPath });

    expect(result.pass).toBe(true);
    expect(result.written).toBe(true);
    expect(existsSync(snapshotPath)).toBe(true);
  });

  it('passes when the new render matches the baseline exactly', () => {
    vi.spyOn(rasterizeModule, 'rasterize').mockReturnValue(RED);

    const snapshotPath = join(workDir, 'baseline.png');
    writeFileSync(snapshotPath, RED);

    const result = matchPdfSnapshot(new Uint8Array(), { snapshotPath });

    expect(result.pass).toBe(true);
    expect(result.diffPixels).toBe(0);
    expect(result.written).toBeUndefined();
  });

  it('fails and writes actual + diff when the render does not match', () => {
    const snapshotPath = join(workDir, 'baseline.png');
    writeFileSync(snapshotPath, RED);

    vi.spyOn(rasterizeModule, 'rasterize').mockReturnValue(BLUE);

    const result = matchPdfSnapshot(new Uint8Array(), { snapshotPath, tolerance: 0 });

    expect(result.pass).toBe(false);
    expect(result.diffPixels).toBeGreaterThan(0);
    expect(existsSync(`${snapshotPath.replace(/\.png$/, '')}.actual.png`)).toBe(true);
    expect(existsSync(`${snapshotPath.replace(/\.png$/, '')}.diff.png`)).toBe(true);
    expect(result.message).toContain('exceeds tolerance');
  });

  it('passes when the diff is within tolerance', () => {
    const a = PNG.sync.read(RED);
    const b = PNG.sync.read(RED);
    b.data[0] = 0; // tweak one channel of one pixel — well under 10% tolerance

    const snapshotPath = join(workDir, 'baseline.png');
    writeFileSync(snapshotPath, PNG.sync.write(a));

    vi.spyOn(rasterizeModule, 'rasterize').mockReturnValue(PNG.sync.write(b));

    expect(matchPdfSnapshot(new Uint8Array(), { snapshotPath, tolerance: 0.1 }).pass).toBe(true);
  });

  it('updates the baseline when update=true', () => {
    const snapshotPath = join(workDir, 'baseline.png');
    writeFileSync(snapshotPath, RED);

    vi.spyOn(rasterizeModule, 'rasterize').mockReturnValue(BLUE);

    const result = matchPdfSnapshot(new Uint8Array(), { snapshotPath, update: true });
    expect(result.pass).toBe(true);
    expect(result.written).toBe(true);
  });

  it('throws a helpful error when snapshotPath is missing', () => {
    expect(() =>
      matchPdfSnapshot(new Uint8Array(), {} as Parameters<typeof matchPdfSnapshot>[1]),
    ).toThrow(/snapshotPath is required/);
  });

  it('reports a clear size mismatch when dimensions differ', () => {
    const snapshotPath = join(workDir, 'baseline.png');
    writeFileSync(snapshotPath, RED);

    vi.spyOn(rasterizeModule, 'rasterize').mockReturnValue(solidPng(16, 16, [255, 0, 0, 255]));

    const result = matchPdfSnapshot(new Uint8Array(), { snapshotPath });
    expect(result.pass).toBe(false);
    expect(result.message).toContain('size mismatch');
  });
});

describe('mkdirSync helper coverage', () => {
  // First-run write must create the snapshot directory if it doesn't exist.
  it('creates intermediate directories for the baseline', () => {
    vi.spyOn(rasterizeModule, 'rasterize').mockReturnValue(RED);
    const snapshotPath = join(workDir, 'a', 'b', 'c.png');
    mkdirSync(workDir, { recursive: true });
    matchPdfSnapshot(new Uint8Array(), { snapshotPath });
    expect(existsSync(snapshotPath)).toBe(true);
  });
});
