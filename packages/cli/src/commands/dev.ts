import { existsSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ComputedGeometry, DocumentNode, PdfNode, ResolvedStyle } from '@imprint-pdf/core';
import type { ElementType, ReactElement } from 'react';
import { INSPECTOR_HTML } from './dev-inspector-html.js';

interface InspectorNode {
  id: string;
  type: string;
  text?: string;
  className?: string;
  style: ResolvedStyle;
  props: Record<string, unknown>;
  geometry?: ComputedGeometry;
  children: InspectorNode[];
}

interface RenderArtifacts {
  pdf: Uint8Array;
  inspector: InspectorNode;
  renderedAt: number;
}

const SAFE_DEPTH = 6;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > SAFE_DEPTH) return '[depth-limited]';
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  if (t === 'function') return '[function]';
  if (t === 'bigint') return `${value as bigint}n`;
  if (t === 'symbol') return String(value);
  if (value instanceof Uint8Array) return `[Uint8Array len=${value.length}]`;
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // skip React-specific bloat that can hide in props.
      if (k === 'children' || k === '$$typeof' || k === '_owner' || k === '_store') continue;
      out[k] = sanitizeValue(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

function nodeToInspector(node: PdfNode, geometries: Map<string, ComputedGeometry>): InspectorNode {
  const props = (node.props ?? {}) as Record<string, unknown>;
  const sanitizedProps = sanitizeValue(props) as Record<string, unknown>;
  const inspector: InspectorNode = {
    id: node.id,
    type: node.type,
    style: node.style ?? {},
    props: sanitizedProps,
    children: node.children.map((c) => nodeToInspector(c, geometries)),
  };
  if (node.type === 'text') inspector.text = (node as { text: string }).text;
  if (typeof props.className === 'string') inspector.className = props.className;
  const geometry = geometries.get(node.id);
  if (geometry) inspector.geometry = geometry;
  return inspector;
}

interface SseClient {
  res: ServerResponse;
}

async function buildArtifacts(absFile: string): Promise<RenderArtifacts> {
  const url = `${pathToFileURL(absFile).toString()}?t=${Date.now()}`;
  const mod = (await import(url)) as Record<string, unknown>;

  const Component =
    (mod.default as ElementType | undefined) ??
    (Object.values(mod).find((v) => typeof v === 'function') as ElementType | undefined);

  if (!Component) {
    throw new Error(`No default export found in ${absFile}`);
  }

  const { createElement } = await import('react');
  const { renderForInspector } = await import('@imprint-pdf/react');

  const element = createElement(Component, {}) as ReactElement;
  const result = await renderForInspector(element);
  const inspector = nodeToInspector(result.tree as DocumentNode, result.geometries);

  return {
    pdf: result.pdf,
    inspector,
    renderedAt: Date.now(),
  };
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

export async function runDev(file: string, options: { port: number }): Promise<void> {
  const absFile = resolve(file);

  if (!existsSync(absFile)) {
    console.error(`File not found: ${absFile}`);
    process.exit(1);
  }

  let cached: RenderArtifacts | null = null;
  let inFlight: Promise<RenderArtifacts> | null = null;
  const clients = new Set<SseClient>();

  async function refresh(): Promise<RenderArtifacts> {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const artifacts = await buildArtifacts(absFile);
        cached = artifacts;
        return artifacts;
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  function broadcast(event: string, data: string): void {
    const payload = `event: ${event}\ndata: ${data}\n\n`;
    for (const client of clients) {
      try {
        client.res.write(payload);
      } catch {
        clients.delete(client);
      }
    }
  }

  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    if (path === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (path === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
      });
      res.write('retry: 1000\n\n');
      const client: SseClient = { res };
      clients.add(client);
      req.on('close', () => clients.delete(client));
      return;
    }

    try {
      const artifacts = cached ?? (await refresh());

      if (path === '/pdf') {
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'no-store',
          'Content-Length': artifacts.pdf.length,
        });
        res.end(Buffer.from(artifacts.pdf));
        return;
      }

      if (path === '/inspect') {
        jsonResponse(res, 200, {
          file: absFile,
          renderedAt: artifacts.renderedAt,
          tree: artifacts.inspector,
        });
        return;
      }

      if (path === '/' || path === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(INSPECTOR_HTML);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (err) {
      const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
      if (path === '/inspect') {
        jsonResponse(res, 500, { error: message });
      } else if (path === '/pdf') {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(message);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<pre>${escapeHtml(message)}</pre>`);
      }
    }
  }

  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  // Initial render so first request is fast.
  refresh().catch(() => {
    // surface via /inspect → error field; don't crash the server
  });

  const { watch } = await import('chokidar');
  const watcher = watch(absFile, { ignoreInitial: true });
  watcher.on('change', () => {
    refresh()
      .then(() => {
        broadcast('reload', String(Date.now()));
        console.log(`↻ re-rendered ${absFile}`);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        broadcast('error', JSON.stringify({ message }));
        console.error('Render failed:', message);
      });
  });

  server.listen(options.port, () => {
    console.log(`Imprint dev server: http://localhost:${options.port}`);
    console.log(`Rendering: ${absFile}`);
    console.log('Live reload + element inspector enabled.');
  });

  const shutdown = (): void => {
    watcher.close().catch(() => {});
    for (const c of clients) c.res.end();
    server.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
