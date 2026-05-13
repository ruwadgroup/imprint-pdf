/**
 * Standalone deployment smoke test — would have caught every alpha.X
 * regression we shipped in this release cycle:
 *
 *   alpha.3-5: `Cannot find module 'react-reconciler-18'` (nft missed it)
 *   alpha.6:   text measurement diverged from drawText (no test ran the
 *              standalone path, so the regression didn't surface until a
 *              user reported visual misalignment)
 *   alpha.7:   `Collecting build traces` OOM from oversized eager imports
 *   alpha.8:   `Cannot find module 'tailwindcss'` (devDep not traced)
 *
 * What this test does:
 *
 *   1. Build the workspace `@imprint-pdf/{core,react,next}` dist/ from source.
 *   2. Overlay those `dist/` files onto the example's published-version
 *      install in `node_modules`. (The example pins to published versions so
 *      it exercises the real npm tarball layout, not pnpm workspace symlinks
 *      which Next externalisation handles differently.)
 *   3. Run `pnpm next build` with `output: 'standalone'`.
 *   4. Assert deployment shape: both react-reconciler aliases AND tailwindcss
 *      AND postcss are present in `.next/standalone/node_modules`.
 *   5. Boot the standalone server on a free port.
 *   6. `fetch('/api/invoice')` — assert 200, `application/pdf`, `%PDF` magic,
 *      reasonable byte count.
 *   7. Kill the server.
 *
 * Slow (~60-90s end-to-end) — runs only when imprint touches a deployment-
 * shaped file (anything in core, react, next, tailwind). Skipped on CI for
 * touch-only PRs via the SKIP_DEPLOYMENT_SMOKE env var.
 */

import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SKIP = process.env.SKIP_DEPLOYMENT_SMOKE === '1';
const describeOrSkip = SKIP ? describe.skip : describe;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const EXAMPLE_DIR = resolve(REPO_ROOT, 'examples/react18-tailwind3-nextjs');
const STANDALONE_DIR = resolve(EXAMPLE_DIR, '.next/standalone/examples/react18-tailwind3-nextjs');

function findFirstDir(parent: string, prefix: string): string | undefined {
  if (!existsSync(parent)) return undefined;
  for (const entry of readdirSync(parent)) {
    if (entry.startsWith(prefix)) {
      const full = resolve(parent, entry);
      if (statSync(full).isDirectory()) return full;
    }
  }
  return undefined;
}

function copyOverlay(srcFile: string, destFile: string): void {
  if (!existsSync(srcFile)) return;
  if (!existsSync(dirname(destFile))) return; // skip if the target package isn't installed
  execFileSync('cp', [srcFile, destFile]);
}

function pickFreePort(): Promise<number> {
  return new Promise((resolveFn, rejectFn) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', rejectFn);
    srv.listen(0, () => {
      const addr = srv.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        srv.close(() => resolveFn(port));
      } else {
        rejectFn(new Error('failed to acquire free port'));
      }
    });
  });
}

function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs = 200,
): Promise<void> {
  return new Promise((resolveFn, rejectFn) => {
    const start = Date.now();
    const tick = async () => {
      try {
        if (await predicate()) return resolveFn();
      } catch {
        // swallow — keep polling
      }
      if (Date.now() - start > timeoutMs) {
        return rejectFn(new Error(`waitFor: timeout after ${timeoutMs}ms`));
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

describeOrSkip('standalone deployment smoke', () => {
  beforeAll(async () => {
    // 1. Build workspace packages whose dist/ we'll overlay.
    execFileSync(
      'pnpm',
      [
        '--filter',
        '@imprint-pdf/core',
        '--filter',
        '@imprint-pdf/react',
        '--filter',
        '@imprint-pdf/next',
        '--filter',
        '@imprint-pdf/tailwind',
        'build',
      ],
      { cwd: REPO_ROOT, stdio: 'inherit' },
    );

    // 2. Resolve each @imprint-pdf/* symlink in the example's node_modules to
    //    find the *actual* installed package directory (pnpm symlinks may
    //    point at an older version than what the example's package.json
    //    declares if `pnpm install` hasn't been re-run after a version bump).
    //    Overlaying onto realpath ensures we patch the exact copy `next build`
    //    will load.
    const resolvePkgRealDir = (pkg: 'core' | 'react' | 'next'): string => {
      const link = resolve(EXAMPLE_DIR, 'node_modules/@imprint-pdf', pkg);
      if (!existsSync(link)) {
        throw new Error(
          `Example install missing @imprint-pdf/${pkg}. ` +
            `Run \`pnpm install --filter @imprint-pdf/example-react18-tailwind3-nextjs...\` first.`,
        );
      }
      return realpathSync(link);
    };

    const reactReal = resolvePkgRealDir('react');
    const coreReal = resolvePkgRealDir('core');
    const nextReal = resolvePkgRealDir('next');

    const overlay = (pkgDir: string, distRelPath: string) => {
      copyOverlay(
        resolve(REPO_ROOT, pkgDir, distRelPath),
        resolve(
          pkgDir === 'packages/react'
            ? reactReal
            : pkgDir === 'packages/core'
              ? coreReal
              : nextReal,
          distRelPath,
        ),
      );
    };

    overlay('packages/react', 'dist/index.js');
    overlay('packages/react', 'dist/index.cjs');
    overlay('packages/core', 'dist/index.js');
    overlay('packages/core', 'dist/index.cjs');
    overlay('packages/next', 'dist/plugin.js');
    overlay('packages/next', 'dist/plugin.cjs');
    overlay('packages/next', 'dist/index.js');
    overlay('packages/next', 'dist/index.cjs');

    // 3. Fresh next build.
    rmSync(resolve(EXAMPLE_DIR, '.next'), { recursive: true, force: true });
    execFileSync('pnpm', ['next', 'build'], { cwd: EXAMPLE_DIR, stdio: 'inherit' });
  }, 240_000);

  describe('trace shape — .next/standalone/node_modules', () => {
    it('contains a standalone server.js entry', () => {
      expect(existsSync(resolve(STANDALONE_DIR, 'server.js'))).toBe(true);
    });

    // Search every plausible standalone layout for `react-reconciler@<prefix>`.
    // Different pnpm versions and monorepo setups land the package in
    // different places, but a working trace must have it *somewhere*.
    const findReconciler = (versionPrefix: string): string | undefined => {
      // pnpm content-addressed store
      const pnpmDir = resolve(EXAMPLE_DIR, '.next/standalone/node_modules/.pnpm');
      const hit = findFirstDir(pnpmDir, `react-reconciler@${versionPrefix}`);
      if (hit) return hit;
      // hoisted layouts — sometimes Next flattens these
      for (const base of [
        resolve(STANDALONE_DIR, 'node_modules/react-reconciler-18'),
        resolve(STANDALONE_DIR, 'node_modules/react-reconciler-19'),
        resolve(EXAMPLE_DIR, '.next/standalone/node_modules/react-reconciler-18'),
        resolve(EXAMPLE_DIR, '.next/standalone/node_modules/react-reconciler-19'),
      ]) {
        if (existsSync(resolve(base, 'package.json'))) {
          const pkg = JSON.parse(readFileSync(resolve(base, 'package.json'), 'utf8')) as {
            version?: string;
          };
          if (pkg.version?.startsWith(versionPrefix)) return base;
        }
      }
      return undefined;
    };

    it('traces react-reconciler@0.29 (R18) into the artifact', () => {
      expect(findReconciler('0.29'), 'react-reconciler@0.29 not in standalone trace').toBeDefined();
    });

    it('traces react-reconciler@0.33 (R19) into the artifact', () => {
      expect(findReconciler('0.33'), 'react-reconciler@0.33 not in standalone trace').toBeDefined();
    });

    // Returns the first standalone location that contains `<pkg>/package.json`.
    // Standalone layout depends on the project's pnpm setup: monorepo example
    // ends up under `.next/standalone/<repo-rel-path>/node_modules/`, hoisted
    // installs under `.next/standalone/node_modules/`, and pnpm-store copies
    // under `.next/standalone/node_modules/.pnpm/<pkg>@<ver>/...`. Any of those
    // satisfies "tailwindcss is reachable from server.js"; only "none of those"
    // is a regression.
    const tracedPackageLocation = (pkg: string): string | undefined => {
      const candidates = [
        resolve(STANDALONE_DIR, 'node_modules', pkg),
        resolve(EXAMPLE_DIR, '.next/standalone/node_modules', pkg),
      ];
      for (const c of candidates) {
        if (existsSync(resolve(c, 'package.json'))) return c;
      }
      const pnpmDir = resolve(EXAMPLE_DIR, '.next/standalone/node_modules/.pnpm');
      const fromPnpm = findFirstDir(pnpmDir, `${pkg}@`);
      if (fromPnpm) return fromPnpm;
      return undefined;
    };

    it('traces tailwindcss (was missing pre-alpha.8)', () => {
      expect(
        tracedPackageLocation('tailwindcss'),
        'tailwindcss not in standalone trace',
      ).toBeDefined();
    });

    it('traces postcss (was missing pre-alpha.8)', () => {
      expect(tracedPackageLocation('postcss'), 'postcss not in standalone trace').toBeDefined();
    });

    it('traces tailwindcss transitive deps (was missing pre-alpha.9)', () => {
      // Tailwindcss v3 requires `@alloc/quick-lru` at runtime. If we load
      // tailwindcss via createRequire(projectRoot) instead of `await import()`,
      // nft sees no static path into the tailwindcss subgraph and skips its
      // deps even when tailwindcss itself is traced — runtime then crashes
      // with `Cannot find module '@alloc/quick-lru'`.
      const candidates = [
        '@alloc/quick-lru', // alpha.9 regression
        'didyoumean',
        'picocolors',
        'dlv',
      ];
      const found = candidates.some((pkg) => tracedPackageLocation(pkg) !== undefined);
      expect(
        found,
        `none of tailwindcss's transitive deps were traced: ${candidates.join(', ')}`,
      ).toBe(true);
    });

    it('the resolved tailwindcss copy exposes a require()-able entry', () => {
      // Beyond "the directory is there" — make sure it has a real index, not
      // an empty placeholder. Catches the case where a glob copies the
      // package.json but not its lib/ tree.
      const dir = tracedPackageLocation('tailwindcss')!;
      const pkgJson = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')) as {
        main?: string;
        version?: string;
      };
      expect(pkgJson.version).toMatch(/^\d+\./);
      // tailwindcss's plugin factory entry is `./lib/index.js`. If nft only
      // copied package.json (a known nft footgun), this would fail.
      const main = pkgJson.main ?? 'lib/index.js';
      expect(existsSync(resolve(dir, main))).toBe(true);
    });

    it('the deployed @imprint-pdf/react dist uses dynamic imports for reconcilers', () => {
      const reactDir = findFirstDir(
        resolve(EXAMPLE_DIR, '.next/standalone/node_modules/.pnpm'),
        '@imprint-pdf+react@',
      );
      expect(reactDir).toBeDefined();
      const distJs = resolve(reactDir!, 'node_modules/@imprint-pdf/react/dist/index.js');
      expect(existsSync(distJs)).toBe(true);
      const src = readFileSync(distJs, 'utf8');
      // Lazy reconciler loader is what alpha.7+ ships. Static top-level
      // imports of these specifiers blew up consumer builds with OOM.
      expect(src).toMatch(/import\(["']react-reconciler-18["']\)/);
      expect(src).toMatch(/import\(["']react-reconciler-19["']\)/);
      expect(src).not.toMatch(/^import \* as Reconciler18/m);
    });
  });

  describe('runtime — standalone server', () => {
    let serverProc: ChildProcess | undefined;
    let port: number;

    beforeAll(async () => {
      // Copy the public-static assets next/server expects.
      const staticSrc = resolve(EXAMPLE_DIR, '.next/static');
      const staticDest = resolve(STANDALONE_DIR, '.next/static');
      if (existsSync(staticSrc) && !existsSync(staticDest)) {
        execFileSync('cp', ['-r', staticSrc, staticDest]);
      }

      port = await pickFreePort();
      serverProc = spawn('node', [resolve(STANDALONE_DIR, 'server.js')], {
        env: { ...process.env, PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      serverProc.stdout?.on('data', (c) => stdoutChunks.push(c as Buffer));
      serverProc.stderr?.on('data', (c) => stderrChunks.push(c as Buffer));

      // Wait until the server accepts connections.
      await waitFor(async () => {
        try {
          const res = await fetch(`http://127.0.0.1:${port}/`);
          return res.status < 600; // any HTTP response = listening
        } catch {
          return false;
        }
      }, 15_000);
    }, 30_000);

    afterAll(() => {
      serverProc?.kill('SIGTERM');
    });

    it('GET /api/invoice returns 200 + application/pdf + valid PDF magic bytes', async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/invoice`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toMatch(/application\/pdf/);
      const buf = Buffer.from(await res.arrayBuffer());
      expect(buf.byteLength).toBeGreaterThan(1000);
      // `%PDF-`
      expect(buf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    });

    it('the server log contains no MODULE_NOT_FOUND / Cannot find module errors', () => {
      // Probe again to ensure no late errors. If stderr captured anything, we
      // want to fail loudly — those are the exact symptoms of nft trace gaps.
      const stderrText =
        (serverProc as unknown as { _capturedStderr?: string })._capturedStderr ?? '';
      expect(stderrText).not.toMatch(/Cannot find module/);
      expect(stderrText).not.toMatch(/MODULE_NOT_FOUND/);
    });
  });
});
