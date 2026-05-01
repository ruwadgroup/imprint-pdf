import { expect } from 'vitest';
import {
  type MatchOptions,
  type MatchResult,
  matchPdfSnapshot,
  resolveSnapshotPath,
} from './match.js';

declare module 'vitest' {
  interface Assertion<T> {
    toMatchPdfSnapshot(name?: string, options?: Omit<MatchOptions, 'snapshotPath'>): T;
  }
  interface AsymmetricMatchersContaining {
    toMatchPdfSnapshot(name?: string, options?: Omit<MatchOptions, 'snapshotPath'>): unknown;
  }
}

interface VitestState {
  testPath?: string;
  currentTestName?: string;
  snapshotState?: { _updateSnapshot?: 'all' | 'new' | 'none' };
}

function asPdfBytes(received: unknown): Uint8Array {
  if (received instanceof Uint8Array) return received;
  if (
    received &&
    typeof received === 'object' &&
    'buffer' in received &&
    received.buffer instanceof ArrayBuffer
  ) {
    return new Uint8Array(received.buffer as ArrayBuffer);
  }
  throw new Error(
    'toMatchPdfSnapshot: expected a Uint8Array (e.g. from `await renderToBuffer(...)`).',
  );
}

expect.extend({
  toMatchPdfSnapshot(
    received: unknown,
    name?: string,
    options: Omit<MatchOptions, 'snapshotPath'> = {},
  ): { pass: boolean; message: () => string } {
    const ctx = this as unknown as VitestState;
    const testPath = ctx.testPath;
    if (!testPath) {
      return {
        pass: false,
        message: () =>
          'toMatchPdfSnapshot: could not determine test file path. Make sure you are running under Vitest.',
      };
    }

    const snapshotName = name ?? ctx.currentTestName ?? 'snapshot';
    const snapshotPath = resolveSnapshotPath(testPath, snapshotName);
    // `vitest -u` propagates as `_updateSnapshot === 'all'`; honor it so PDF
    // baselines update alongside `.snap` files.
    const update = options.update ?? (ctx.snapshotState?._updateSnapshot === 'all' || undefined);

    let result: MatchResult;
    try {
      result = matchPdfSnapshot(asPdfBytes(received), {
        ...options,
        snapshotPath,
        ...(update !== undefined && { update }),
      });
    } catch (err) {
      return { pass: false, message: () => `toMatchPdfSnapshot: ${(err as Error).message}` };
    }
    return { pass: result.pass, message: () => result.message };
  },
});
