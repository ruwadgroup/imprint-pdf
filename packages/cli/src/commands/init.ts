import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Framework = 'next-app' | 'next-pages' | 'vite' | 'generic';

interface Changes {
  wrote: string[];
  edited: string[];
  skipped: string[];
}

const CONFIG_TEMPLATE_TS = `import { defineConfig } from '@imprint-pdf/core/config'

export default defineConfig({
  fonts: [
    // { family: 'Inter', src: './public/fonts/Inter.woff2' },
  ],
})
`;

const CONFIG_TEMPLATE_JS = `const { defineConfig } = require('@imprint-pdf/core/config')

module.exports = defineConfig({
  fonts: [
    // { family: 'Inter', src: './public/fonts/Inter.woff2' },
  ],
})
`;

const EXAMPLE_TEMPLATE_TSX = `import { Document, Page } from '@imprint-pdf/react'

export function ExamplePdf() {
  return (
    <Document title="Example">
      <Page size="A4" className="p-12 font-sans bg-white text-gray-900">
        <h1 className="text-3xl font-bold">Hello, imprint-pdf</h1>
        <p className="mt-4 text-base">Edit src/templates/ExamplePdf.tsx to customise this page.</p>
      </Page>
    </Document>
  )
}
`;

const NEXT_APP_ROUTE_TSX = `import { pdf } from '@imprint-pdf/next'
import { ExamplePdf } from '@/templates/ExamplePdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = () => pdf(<ExamplePdf />)
`;

const NEXT_PAGES_HANDLER_TSX = `import { pdf } from '@imprint-pdf/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ExamplePdf } from '@/templates/ExamplePdf'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const response = await pdf(<ExamplePdf />)
  res.setHeader('Content-Type', 'application/pdf')
  const bytes = new Uint8Array(await response.arrayBuffer())
  res.send(Buffer.from(bytes))
}
`;

const VITE_EXAMPLE_TS = `import { pdf } from '@imprint-pdf/react'
import { ExamplePdf } from './templates/ExamplePdf'

export async function downloadExample() {
  const response = await pdf(<ExamplePdf />)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  window.open(url)
}
`;

function detectFramework(cwd: string): Framework {
  const pkgPath = path.join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return 'generic';
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) {
      return existsSync(path.join(cwd, 'app')) || existsSync(path.join(cwd, 'src/app'))
        ? 'next-app'
        : 'next-pages';
    }
    if (deps.vite) return 'vite';
  } catch {}
  return 'generic';
}

function findNextConfig(cwd: string): string | undefined {
  for (const name of ['next.config.ts', 'next.config.mjs', 'next.config.js', 'next.config.cjs']) {
    const abs = path.join(cwd, name);
    if (existsSync(abs)) return abs;
  }
  return undefined;
}

function findViteConfig(cwd: string): string | undefined {
  for (const name of ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs']) {
    const abs = path.join(cwd, name);
    if (existsSync(abs)) return abs;
  }
  return undefined;
}

// Idempotent — if `withImprint` already appears, leaves the file alone.
function wireNextConfig(configPath: string, changes: Changes): void {
  const src = readFileSync(configPath, 'utf8');
  if (src.includes('withImprint')) {
    changes.skipped.push(`${path.basename(configPath)} (withImprint already present)`);
    return;
  }
  const exportDefault = /export\s+default\s+([\s\S]+?)(;\s*)?$/m;
  const m = src.match(exportDefault);
  if (!m) {
    changes.skipped.push(
      `${path.basename(configPath)} (no \`export default\` found — wire withImprint manually)`,
    );
    return;
  }
  const expr = m[1]!.trim().replace(/;$/, '');
  const wrapped = `export default withImprint({})(${expr})`;
  const importLine = `import { withImprint } from '@imprint-pdf/next/plugin'\n`;
  writeFileSync(configPath, importLine + src.replace(exportDefault, wrapped + '\n'), 'utf8');
  changes.edited.push(path.basename(configPath));
}

function wireViteConfig(configPath: string, changes: Changes): void {
  const src = readFileSync(configPath, 'utf8');
  if (src.includes('@imprint-pdf/vite')) {
    changes.skipped.push(`${path.basename(configPath)} (@imprint-pdf/vite already present)`);
    return;
  }
  const pluginsMatch = src.match(/plugins\s*:\s*\[/);
  if (!pluginsMatch) {
    changes.skipped.push(
      `${path.basename(configPath)} (no \`plugins\` array — wire imprint() manually)`,
    );
    return;
  }
  const idx = pluginsMatch.index! + pluginsMatch[0].length;
  const importLine = `import { imprint } from '@imprint-pdf/vite'\n`;
  writeFileSync(
    configPath,
    importLine + src.slice(0, idx) + `\n    imprint(),\n` + src.slice(idx),
    'utf8',
  );
  changes.edited.push(path.basename(configPath));
}

function writeIfMissing(filePath: string, contents: string, changes: Changes): void {
  if (existsSync(filePath)) {
    changes.skipped.push(path.relative(process.cwd(), filePath));
    return;
  }
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents, 'utf8');
  changes.wrote.push(path.relative(process.cwd(), filePath));
}

export async function runInit(options: { ts: boolean }) {
  const cwd = process.cwd();
  const framework = detectFramework(cwd);
  const changes: Changes = { wrote: [], edited: [], skipped: [] };
  const useSrc = existsSync(path.join(cwd, 'src'));

  writeIfMissing(
    path.join(cwd, options.ts ? 'imprint.config.ts' : 'imprint.config.js'),
    options.ts ? CONFIG_TEMPLATE_TS : CONFIG_TEMPLATE_JS,
    changes,
  );

  if (framework === 'next-app' || framework === 'next-pages') {
    const nextConfig = findNextConfig(cwd);
    if (nextConfig) {
      wireNextConfig(nextConfig, changes);
    } else {
      writeIfMissing(
        path.join(cwd, 'next.config.ts'),
        `import { withImprint } from '@imprint-pdf/next/plugin'\nimport type { NextConfig } from 'next'\n\nconst nextConfig: NextConfig = {}\n\nexport default withImprint({})(nextConfig)\n`,
        changes,
      );
    }

    writeIfMissing(
      path.join(cwd, useSrc ? 'src/templates' : 'templates', 'ExamplePdf.tsx'),
      EXAMPLE_TEMPLATE_TSX,
      changes,
    );

    if (framework === 'next-app') {
      const appDir = existsSync(path.join(cwd, 'src/app')) ? 'src/app' : 'app';
      writeIfMissing(path.join(cwd, appDir, 'api/pdf/route.tsx'), NEXT_APP_ROUTE_TSX, changes);
    } else {
      const pagesDir = existsSync(path.join(cwd, 'src/pages')) ? 'src/pages' : 'pages';
      writeIfMissing(path.join(cwd, pagesDir, 'api/pdf.tsx'), NEXT_PAGES_HANDLER_TSX, changes);
    }
  } else if (framework === 'vite') {
    const viteConfig = findViteConfig(cwd);
    if (viteConfig) wireViteConfig(viteConfig, changes);
    writeIfMissing(
      path.join(cwd, useSrc ? 'src/templates' : 'templates', 'ExamplePdf.tsx'),
      EXAMPLE_TEMPLATE_TSX,
      changes,
    );
    writeIfMissing(path.join(cwd, 'src/pdf.ts'), VITE_EXAMPLE_TS, changes);
  }

  if (changes.wrote.length) console.log(`Created:\n  ${changes.wrote.join('\n  ')}`);
  if (changes.edited.length) console.log(`Edited:\n  ${changes.edited.join('\n  ')}`);
  if (changes.skipped.length) {
    console.log(`Skipped (already present):\n  ${changes.skipped.join('\n  ')}`);
  }

  console.log('\nNext steps:');
  if (framework === 'next-app' || framework === 'next-pages') {
    console.log('  Run `pnpm dev`, then GET /api/pdf to download the example.');
  } else if (framework === 'vite') {
    console.log('  Import `downloadExample` from `./src/pdf.ts` and call it from a button.');
  } else {
    console.log('  Run `pnpm imprint render src/templates/ExamplePdf.tsx` to render a PDF.');
  }
}
