import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const GOLDEN_DIR = resolve(HERE, '..', '..', '__goldens__');

const UPDATE = process.env.UPDATE_GOLDENS === '1';

/** Snapshot structured data — text positions, annotation lists, geometry counts. */
export function expectGolden(name: string, value: unknown): void {
  if (!existsSync(GOLDEN_DIR)) mkdirSync(GOLDEN_DIR, { recursive: true });
  const path = join(GOLDEN_DIR, `${name}.json`);
  const serialized = JSON.stringify(value, null, 2);

  if (UPDATE || !existsSync(path)) {
    writeFileSync(path, `${serialized}\n`);
    return;
  }

  const expected = readFileSync(path, 'utf8').trimEnd();
  if (serialized !== expected) {
    const failPath = join(GOLDEN_DIR, `${name}.actual.json`);
    writeFileSync(failPath, `${serialized}\n`);
    throw new Error(
      `[${name}] Golden mismatch. Diff ${path} vs ${failPath}. If intentional, run UPDATE_GOLDENS=1.`,
    );
  }
}

/** Strips floating-point noise so sub-pixel jitter doesn't churn snapshots. */
export function roundDeep<T>(value: T, decimals = 2): T {
  const factor = 10 ** decimals;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'number') return Math.round(v * factor) / factor;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = walk(val);
      return out;
    }
    return v;
  };
  return walk(value) as T;
}
