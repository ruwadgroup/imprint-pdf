import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAssetResolver } from './assets.js';

// `fs.readFile` returns a Buffer that is typically a view into Node's
// allocation pool — `Buffer.from(...).buffer` is the whole pool. Downstream
// WASM consumers (HarfBuzz, fontkit) that walk `.buffer` would read pool
// padding and throw `RangeError: Index out of range`. Asset resolution must
// hand back a tight Uint8Array.
describe('createAssetResolver — file path bytes are tight', () => {
  let dir: string;
  let smallFile: string;
  let largeFile: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'imprint-assets-test-'));
    smallFile = join(dir, 'small.bin');
    largeFile = join(dir, 'large.bin');
    // Small (16 B): pool-backed in Node — most likely to expose the bug.
    await writeFile(
      smallFile,
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    );
    // Large (>4 KB): typically not pool-backed; tests the no-op branch.
    await writeFile(largeFile, new Uint8Array(8192).fill(42));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns a Uint8Array whose buffer exactly fits the file (small file)', async () => {
    const resolver = createAssetResolver();
    const bytes = await resolver.resolve(smallFile);
    expect(bytes.byteOffset).toBe(0);
    expect(bytes.byteLength).toBe(16);
    expect(bytes.buffer.byteLength).toBe(16);
    expect(Array.from(bytes)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('returns a Uint8Array whose buffer exactly fits the file (large file)', async () => {
    const resolver = createAssetResolver();
    const bytes = await resolver.resolve(largeFile);
    expect(bytes.byteOffset).toBe(0);
    expect(bytes.byteLength).toBe(8192);
    expect(bytes.buffer.byteLength).toBe(8192);
    expect(bytes[0]).toBe(42);
    expect(bytes[8191]).toBe(42);
  });
});
