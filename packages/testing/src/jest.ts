import {
  type MatchOptions,
  type MatchResult,
  matchPdfSnapshot,
  resolveSnapshotPath,
} from './match.js';

interface JestExpect {
  extend(matchers: Record<string, unknown>): void;
}

interface JestMatcherState {
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

const matcher = function toMatchPdfSnapshot(
  this: JestMatcherState,
  received: unknown,
  name?: string,
  options: Omit<MatchOptions, 'snapshotPath'> = {},
): { pass: boolean; message: () => string } {
  if (!this.testPath) {
    return {
      pass: false,
      message: () =>
        'toMatchPdfSnapshot: could not determine test file path. Make sure you are running under Jest.',
    };
  }

  const snapshotName = name ?? this.currentTestName ?? 'snapshot';
  const snapshotPath = resolveSnapshotPath(this.testPath, snapshotName);
  const update = options.update ?? (this.snapshotState?._updateSnapshot === 'all' || undefined);

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
};

// Side-effecting register-on-import so users only need
// `import '@imprint/testing/jest'` in setupFilesAfterEach.
const e = (globalThis as { expect?: JestExpect }).expect;
if (e && typeof e.extend === 'function') {
  e.extend({ toMatchPdfSnapshot: matcher });
}

export { matcher as toMatchPdfSnapshot };

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchPdfSnapshot(name?: string, options?: Omit<MatchOptions, 'snapshotPath'>): R;
    }
  }
}
