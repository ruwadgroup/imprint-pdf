import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ElementType, ReactElement } from 'react';

export async function runRender(
  file: string,
  options: { out: string; watch: boolean; props?: string },
): Promise<void> {
  const absFile = resolve(file);

  if (!existsSync(absFile)) {
    console.error(`File not found: ${absFile}`);
    process.exit(1);
  }

  await renderFile(absFile, options);

  if (options.watch) {
    const { watch } = await import('chokidar');
    const { spawn } = await import('node:child_process');
    const watcher = watch(absFile, { ignoreInitial: true });
    console.log(`Watching ${absFile}...`);

    const argv1 = process.argv[1] ?? '';
    watcher.on('change', () => {
      // Spawn a fresh child process per render so stale ESM module instances
      // (unique-URL imports are never GC'd within the same process) don't
      // accumulate over time during long watch sessions.
      const child = spawn(process.execPath, [argv1, 'render', absFile, '--out', options.out], {
        env: process.env,
        stdio: 'inherit',
      });
      child.on('error', (err) => {
        console.error('Render failed:', err);
      });
    });
  }
}

async function renderFile(
  absFile: string,
  options: { out: string; props?: string },
): Promise<void> {
  try {
    // bust the module cache on each render by appending a timestamp query
    const url = `${pathToFileURL(absFile).toString()}?t=${Date.now()}`;
    const mod = (await import(url)) as Record<string, unknown>;

    const Component =
      (mod.default as ElementType | undefined) ??
      (Object.values(mod).find((v) => typeof v === 'function') as ElementType | undefined);

    if (!Component) {
      console.error('No default export found in', absFile);
      return;
    }

    let props: Record<string, unknown> = {};
    if (options.props) {
      try {
        props = JSON.parse(options.props) as Record<string, unknown>;
      } catch {
        console.error(`Invalid --props JSON: ${options.props}`);
        return;
      }
    }

    const { createElement } = await import('react');
    const { renderToBuffer } = await import('@imprint-pdf/react');

    const element = createElement(Component, props) as ReactElement;
    const pdf = await renderToBuffer(element);

    const outDir = options.out;
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const outFile = join(outDir, basename(absFile).replace(/\.[jt]sx?$/, '.pdf'));
    writeFileSync(outFile, pdf);
    console.log(`✓ Rendered ${outFile} (${(pdf.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error('Render failed:', err);
  }
}
