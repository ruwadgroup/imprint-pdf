import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Regression guard for the isomorphic entry: the built `@imprint-pdf/react`
// must have no static `node:*` imports at module scope, or browser bundlers
// (Vite/webpack/Rollup) break with "X is not exported by __vite-browser-external".
// Node access in the render path is dynamic (`await import('node:fs')`) and
// runtime-guarded; this test fails if a static one creeps back in.
const STATIC_NODE_IMPORT =
  /^\s*import[^;\n]*from\s*['"](?:node:)?(?:fs|fs\/promises|module|path|url|os|child_process)['"]/m;

describe('built @imprint-pdf/react entry is browser-safe', () => {
  const distDir = fileURLToPath(new URL('../dist/', import.meta.url));

  it('dist/index.js has no static node built-in imports', () => {
    const file = `${distDir}index.js`;
    // Build runs before tests in CI (`pnpm build` then `pnpm test:ci`).
    if (!existsSync(file)) throw new Error(`build first: ${file} missing`);
    expect(readFileSync(file, 'utf8')).not.toMatch(STATIC_NODE_IMPORT);
  });

  it('dist/standalone.js (browser/edge build) has no static node built-in imports', () => {
    const file = `${distDir}standalone.js`;
    if (!existsSync(file)) throw new Error(`build first: ${file} missing`);
    expect(readFileSync(file, 'utf8')).not.toMatch(STATIC_NODE_IMPORT);
  });
});
