import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { runDev } from './dev.js';

// Write fixtures inside the cli package so module resolution can climb up
// to the workspace's node_modules (react / @imprint-pdf/react). System tmpdir
// has no node_modules and ESM imports would fail.
const FIXTURE_ROOT = join(__dirname, '..', '..', '.test-tmp');
mkdirSync(FIXTURE_ROOT, { recursive: true });

interface InspectorNode {
  id: string;
  type: string;
  className?: string;
  text?: string;
  geometry?: { width: number; height: number };
  children: InspectorNode[];
}

const cleanup: Array<() => Promise<void> | void> = [];
afterAll(async () => {
  for (const fn of cleanup.reverse()) await fn();
  rmSync(FIXTURE_ROOT, { recursive: true, force: true });
});

async function pickPort(): Promise<number> {
  const { createServer } = await import('node:http');
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.listen(0, () => {
      const addr = srv.address();
      if (typeof addr === 'object' && addr) {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close();
        reject(new Error('no address'));
      }
    });
    srv.on('error', reject);
  });
}

function findByType(node: InspectorNode, type: string): InspectorNode | null {
  if (node.type === type) return node;
  for (const c of node.children) {
    const f = findByType(c, type);
    if (f) return f;
  }
  return null;
}

describe('imprint dev', () => {
  it('serves /, /pdf, and /inspect with a live tree', async () => {
    const dir = mkdtempSync(join(FIXTURE_ROOT, 'dev-'));
    const fixture = join(dir, 'fixture.mjs');
    // Single-page Document so layout has something to chew on.
    // Imports @imprint-pdf/react via workspace resolution.
    writeFileSync(
      fixture,
      `
        import { createElement } from 'react';
        import { Document, Page } from '@imprint-pdf/react';
        export default function Doc() {
          return createElement(
            Document,
            null,
            createElement(
              Page,
              { size: 'A4' },
              createElement('div', { className: 'p-4' },
                createElement('span', null, 'hello inspector')
              )
            )
          );
        }
      `,
    );

    const port = await pickPort();
    const devPromise = runDev(fixture, { port });
    cleanup.push(() => {
      // SIGINT triggers the dev server's shutdown path.
      process.emit('SIGINT');
    });
    await devPromise;

    // Wait for the server to be listening — runDev resolves after listen(),
    // but give the initial render a moment to land in cache.
    const base = `http://127.0.0.1:${port}`;

    const inspectRes = await fetch(`${base}/inspect`);
    expect(inspectRes.status).toBe(200);
    const inspect = (await inspectRes.json()) as {
      file: string;
      renderedAt: number;
      tree: InspectorNode;
    };
    expect(inspect.file).toBe(fixture);
    expect(inspect.tree.type).toBe('document');

    const page = findByType(inspect.tree, 'page');
    expect(page).not.toBeNull();
    expect(page!.geometry).toBeDefined();
    expect(page!.geometry!.width).toBeGreaterThan(0);

    const text = findByType(inspect.tree, 'text');
    expect(text?.text).toContain('hello inspector');

    const pdfRes = await fetch(`${base}/pdf`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get('content-type')).toBe('application/pdf');
    const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
    expect(pdfBuf.subarray(0, 4).toString()).toBe('%PDF');

    const htmlRes = await fetch(`${base}/`);
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('Imprint dev');
    expect(html).toContain("EventSource('/events')");
  }, 30_000);

  it('reports render errors via /inspect', async () => {
    const dir = mkdtempSync(join(FIXTURE_ROOT, 'dev-err-'));
    const fixture = join(dir, 'broken.mjs');
    writeFileSync(fixture, `export default function Broken() { throw new Error('boom'); }`);

    const port = await pickPort();
    await runDev(fixture, { port });
    cleanup.push(() => {
      process.emit('SIGINT');
    });

    const res = await fetch(`http://127.0.0.1:${port}/inspect`);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    // React's reconciler swallows the thrown error and produces no root, so
    // we only assert the error path is wired — the exact message varies.
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  }, 30_000);
});
