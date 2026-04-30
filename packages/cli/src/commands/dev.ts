import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ElementType, ReactElement } from 'react';

export async function runDev(file: string, options: { port: number }): Promise<void> {
  const absFile = resolve(file);

  if (!existsSync(absFile)) {
    console.error(`File not found: ${absFile}`);
    process.exit(1);
  }

  const server = createServer((req, res) => {
    if (req.url === '/favicon.ico') {
      res.writeHead(404);
      res.end();
      return;
    }

    void (async () => {
      try {
        // append timestamp to bust node's module cache for each request
        const url = `${pathToFileURL(absFile).toString()}?t=${Date.now()}`;
        const mod = (await import(url)) as Record<string, unknown>;

        const Component =
          (mod.default as ElementType | undefined) ??
          (Object.values(mod).find((v) => typeof v === 'function') as ElementType | undefined);

        if (!Component) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`No default export found in ${absFile}`);
          return;
        }

        const { createElement } = await import('react');
        const { renderToBuffer } = await import('@imprint/react');

        const element = createElement(Component, {}) as ReactElement;
        const pdf = await renderToBuffer(element);

        if (req.url?.startsWith('/pdf')) {
          res.writeHead(200, { 'Content-Type': 'application/pdf' });
          res.end(Buffer.from(pdf));
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Imprint Dev — ${file}</title>
  <style>
    body { margin: 0; background: #1a1a1a; }
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe src="/pdf"></iframe>
  <script>
    setInterval(function() {
      document.querySelector('iframe').src = '/pdf?t=' + Date.now()
    }, 1000)
  </script>
</body>
</html>`);
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(String(err));
      }
    })();
  });

  server.listen(options.port, () => {
    console.log(`Imprint dev server: http://localhost:${options.port}`);
    console.log(`Rendering: ${absFile}`);
    console.log('The page auto-refreshes every second.');
  });
}
