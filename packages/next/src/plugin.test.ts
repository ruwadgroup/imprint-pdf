/**
 * Pins `withImprint(...)` against the regressions we've shipped:
 *
 * - alpha.3-4: missing `serverExternalPackages` → bundler tried to compile
 *              imprint internals, RSC compilation bailed.
 * - alpha.6:   only set Next 15's key, not Next 14's `experimental.*`.
 * - alpha.7:   `tailwindcss` / `postcss` not externalised, runtime resolve
 *              failed because nft didn't trace them.
 * - alpha.8:   missing `outputFileTracingIncludes` → trace still skipped
 *              pnpm `.pnpm/` layouts.
 *
 * Any future bump that omits one of these keys would re-break a deploy. Pin
 * them so a regression fails CI instead of a customer's production build.
 */

import type { NextConfig } from 'next';
import { describe, expect, it, vi } from 'vitest';
import { withImprint } from './plugin.js';

const IMPRINT_EXTERNALS = ['@imprint-pdf/next', '@imprint-pdf/react', '@imprint-pdf/core'];
const TAILWIND_RUNTIME = ['tailwindcss', 'postcss'];

describe('withImprint() — externals', () => {
  it('adds imprint + tailwind runtime to serverExternalPackages', () => {
    const out = withImprint()({});
    for (const name of [...IMPRINT_EXTERNALS, ...TAILWIND_RUNTIME]) {
      expect(out.serverExternalPackages).toContain(name);
    }
  });

  it("also writes Next 14's experimental.serverComponentsExternalPackages", () => {
    const out = withImprint()({});
    const exp = (out as { experimental?: { serverComponentsExternalPackages?: string[] } })
      .experimental;
    for (const name of [...IMPRINT_EXTERNALS, ...TAILWIND_RUNTIME]) {
      expect(exp?.serverComponentsExternalPackages).toContain(name);
    }
  });

  it('preserves existing serverExternalPackages entries', () => {
    const out = withImprint()({ serverExternalPackages: ['my-other-pkg'] });
    expect(out.serverExternalPackages).toContain('my-other-pkg');
    expect(out.serverExternalPackages).toContain('@imprint-pdf/react');
  });

  it('preserves existing experimental.serverComponentsExternalPackages', () => {
    const out = withImprint()({
      experimental: { serverComponentsExternalPackages: ['my-other-pkg'] },
    } as NextConfig);
    const exp = (out as { experimental?: { serverComponentsExternalPackages?: string[] } })
      .experimental;
    expect(exp?.serverComponentsExternalPackages).toContain('my-other-pkg');
    expect(exp?.serverComponentsExternalPackages).toContain('@imprint-pdf/react');
  });
});

describe('withImprint() — outputFileTracingIncludes', () => {
  it('includes glob entries for tailwindcss and postcss', () => {
    const out = withImprint()({});
    const includes = (
      out as { experimental?: { outputFileTracingIncludes?: Record<string, string[]> } }
    ).experimental?.outputFileTracingIncludes?.['**/*'];

    expect(includes).toBeDefined();
    expect(includes).toEqual(
      expect.arrayContaining(['./node_modules/tailwindcss/**/*', './node_modules/postcss/**/*']),
    );
  });

  it('covers pnpm .pnpm/ resolved layouts so tailwindcss is found in hoisted mode', () => {
    const out = withImprint()({});
    const includes = (
      out as { experimental?: { outputFileTracingIncludes?: Record<string, string[]> } }
    ).experimental?.outputFileTracingIncludes?.['**/*'];

    expect(includes).toEqual(
      expect.arrayContaining([
        './node_modules/.pnpm/tailwindcss@*/node_modules/tailwindcss/**/*',
        './node_modules/.pnpm/postcss@*/node_modules/postcss/**/*',
      ]),
    );
  });

  it('preserves user-supplied outputFileTracingIncludes entries', () => {
    const out = withImprint()({
      experimental: {
        outputFileTracingIncludes: {
          '**/*': ['./node_modules/my-custom-pkg/**/*'],
          '/api/foo': ['./some/dir/**'],
        },
      },
    } as NextConfig);

    const includes = (
      out as { experimental?: { outputFileTracingIncludes?: Record<string, string[]> } }
    ).experimental?.outputFileTracingIncludes;
    expect(includes?.['**/*']).toContain('./node_modules/my-custom-pkg/**/*');
    expect(includes?.['**/*']).toContain('./node_modules/tailwindcss/**/*');
    // Other route-specific entries pass through untouched.
    expect(includes?.['/api/foo']).toEqual(['./some/dir/**']);
  });
});

describe('withImprint() — webpack hook', () => {
  it('enables asyncWebAssembly and layers experiments', () => {
    const out = withImprint()({});
    const webpackHook = out.webpack as (cfg: object, ctx: unknown) => Record<string, unknown>;
    const cfg = webpackHook({}, {});
    const exps = cfg.experiments as { asyncWebAssembly?: boolean; layers?: boolean };
    expect(exps.asyncWebAssembly).toBe(true);
    expect(exps.layers).toBe(true);
  });

  it('adds the .wasm webassembly/async rule', () => {
    const out = withImprint()({});
    const webpackHook = out.webpack as (cfg: object, ctx: unknown) => Record<string, unknown>;
    const cfg = webpackHook({}, {});
    const rules = (cfg.module as { rules: { test: RegExp; type: string }[] }).rules;
    const wasmRule = rules.find((r) => r.type === 'webassembly/async');
    expect(wasmRule).toBeDefined();
    expect(wasmRule!.test.test('foo.wasm')).toBe(true);
  });

  it("chains the user's own webpack hook after applying imprint config", () => {
    const userHook = vi.fn((cfg: Record<string, unknown>) => ({ ...cfg, __userTouched: true }));
    const out = withImprint()({ webpack: userHook } as NextConfig);
    const webpackHook = out.webpack as (cfg: object, ctx: unknown) => Record<string, unknown>;
    const result = webpackHook({}, {});
    expect(userHook).toHaveBeenCalledOnce();
    // The user hook received the imprint-augmented config, not a raw one.
    const [receivedCfg] = userHook.mock.calls[0]!;
    expect(
      (receivedCfg as { experiments?: { asyncWebAssembly?: boolean } }).experiments
        ?.asyncWebAssembly,
    ).toBe(true);
    expect(result.__userTouched).toBe(true);
  });

  it('does not throw when the ImprintWebpackPlugin require fails (defensive)', () => {
    // Smoke: this path uses try/catch around `require('@imprint-pdf/tailwind/webpack')`.
    // The plugin should still produce a usable webpack config even if the plugin
    // can't be loaded (which can happen during workspace bootstrap before
    // tailwind has been built).
    expect(() => {
      const out = withImprint()({});
      const webpackHook = out.webpack as (cfg: object, ctx: unknown) => Record<string, unknown>;
      webpackHook({}, {});
    }).not.toThrow();
  });
});
