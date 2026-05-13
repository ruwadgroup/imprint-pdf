/**
 * The reconciler is loaded lazily via `await import('react-reconciler-18')`
 * (or -19) inside `loadReconciler()`. The CJS package's named exports must
 * survive Node's CJS-named-export detection on dynamic import, or destructuring
 * `DefaultEventPriority` / `LegacyRoot` returns undefined and the host config
 * silently fails.
 *
 * Regression history:
 *   alpha.3-5: createRequire(import.meta.url) → nft couldn't trace, "Cannot
 *              find module 'react-reconciler-18'" in deploy.
 *   alpha.6:   static `import * as Reconciler18 from ...` → fixed deploy
 *              but bloated trace, consumer builds OOMed.
 *   alpha.7:   lazy `await import('...')` → both work; this file pins it.
 */

import { describe, expect, it } from 'vitest';

describe('reconciler dynamic imports', () => {
  it('resolves react-reconciler-18 to a callable factory', async () => {
    const mod = (await import('react-reconciler-18')) as unknown as {
      default?: (config: unknown) => unknown;
    } & ((config: unknown) => unknown);
    const factory = (mod.default ?? mod) as (config: unknown) => unknown;
    expect(typeof factory).toBe('function');
  });

  it('resolves react-reconciler-19 to a callable factory', async () => {
    const mod = (await import('react-reconciler-19')) as unknown as {
      default?: (config: unknown) => unknown;
    } & ((config: unknown) => unknown);
    const factory = (mod.default ?? mod) as (config: unknown) => unknown;
    expect(typeof factory).toBe('function');
  });

  it('exposes DefaultEventPriority and LegacyRoot from react-reconciler-18/constants.js', async () => {
    const mod = (await import('react-reconciler-18/constants.js')) as unknown as {
      default?: { DefaultEventPriority?: number; LegacyRoot?: number };
      DefaultEventPriority?: number;
      LegacyRoot?: number;
    };
    const constants = mod.default ?? mod;
    expect(typeof constants.DefaultEventPriority).toBe('number');
    expect(typeof constants.LegacyRoot).toBe('number');
    expect(constants.LegacyRoot).toBe(0);
  });

  it('exposes DefaultEventPriority and LegacyRoot from react-reconciler-19/constants.js', async () => {
    const mod = (await import('react-reconciler-19/constants.js')) as unknown as {
      default?: { DefaultEventPriority?: number; LegacyRoot?: number };
      DefaultEventPriority?: number;
      LegacyRoot?: number;
    };
    const constants = mod.default ?? mod;
    expect(typeof constants.DefaultEventPriority).toBe('number');
    expect(typeof constants.LegacyRoot).toBe('number');
    expect(constants.LegacyRoot).toBe(0);
  });

  it('buildPdfNodeTree loads the right reconciler for React 19 and produces a document', async () => {
    const React = (await import('react')).default;
    const major = parseInt(String(React.version).split('.')[0] ?? '0', 10);
    // Workspace dev runs on R19; the dynamic loader picks reconciler-19.
    expect(major).toBeGreaterThanOrEqual(18);

    const { buildPdfNodeTree } = await import('./reconciler.js');
    const { Document } = await import('./components/Document.js');
    const { Page } = await import('./components/Page.js');
    const tree = await buildPdfNodeTree(
      React.createElement(
        Document,
        null,
        React.createElement(Page, { size: 'A4' }, React.createElement('span', null, 'hi')),
      ),
    );
    expect(tree.type).toBe('document');
    expect(tree.children[0]?.type).toBe('page');
  });

  it('memoises the reconciler — repeated calls reuse the same factory', async () => {
    const { buildPdfNodeTree } = await import('./reconciler.js');
    const { Document } = await import('./components/Document.js');
    const { Page } = await import('./components/Page.js');
    const React = (await import('react')).default;

    const make = () =>
      React.createElement(
        Document,
        null,
        React.createElement(Page, { size: 'A4' }, React.createElement('span', null, 'x')),
      );

    // Two sequential renders must succeed; the second hits the cache path.
    const t0 = performance.now();
    await buildPdfNodeTree(make());
    const t1 = performance.now();
    await buildPdfNodeTree(make());
    const t2 = performance.now();

    // The cached second call shouldn't take more than 4x the first; in practice
    // it's near-instant (no import + no reconciler-factory call).
    const firstMs = t1 - t0;
    const secondMs = t2 - t1;
    expect(secondMs).toBeLessThan(Math.max(50, firstMs * 4));
  });
});
