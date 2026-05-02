import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { ResolvedStyle } from '@imprint-pdf/core';
import { parseCssToStyleMap } from './css-to-styles.js';
import type { ImprintTailwindOptions } from './index.js';

// Conventional locations for a Tailwind v4 entry stylesheet. First match wins.
const STYLESHEET_AUTO_PATHS = [
  'src/app.css',
  'src/globals.css',
  'src/index.css',
  'src/styles.css',
  'src/styles/app.css',
  'src/styles/globals.css',
  'app/globals.css',
  'app/app.css',
  'styles/app.css',
  'styles/globals.css',
];

function autoDetectStylesheet(projectRoot: string): string | undefined {
  for (const rel of STYLESHEET_AUTO_PATHS) {
    if (existsSync(path.join(projectRoot, rel))) return rel;
  }
  return undefined;
}

// Tailwind v4 programmatic surface — pinned by the `tailwindcss>=4` peer dep.
interface TailwindV4 {
  compile: (
    css: string,
    opts?: {
      base?: string;
      loadStylesheet?: (id: string, base: string) => Promise<{ content: string; base: string }>;
    },
  ) => Promise<{ build: (candidates: string[]) => string }>;
}

export async function runTailwind(
  classes: Set<string>,
  options: ImprintTailwindOptions,
  projectRoot: string,
): Promise<Map<string, ResolvedStyle>> {
  if (classes.size === 0) return new Map();

  try {
    // Resolve tailwindcss from the user's project so they get the version
    // their config was written against.
    const req = createRequire(path.join(projectRoot, 'package.json'));
    const tw = req('tailwindcss') as TailwindV4;
    const twDir = path.dirname(req.resolve('tailwindcss/package.json'));

    async function loadStylesheet(
      id: string,
      base: string,
    ): Promise<{ content: string; base: string }> {
      if (id === 'tailwindcss') {
        const cssPath = path.join(twDir, 'index.css');
        return { content: readFileSync(cssPath, 'utf8'), base: twDir };
      }
      try {
        const pkgDir = path.dirname(req.resolve(`${id}/package.json`));
        const cssPath = path.join(pkgDir, 'index.css');
        return { content: readFileSync(cssPath, 'utf8'), base: pkgDir };
      } catch {}
      try {
        const abs = path.resolve(base, id);
        return { content: readFileSync(abs, 'utf8'), base: path.dirname(abs) };
      } catch {}
      return { content: '', base };
    }

    const stylesheet = options.stylesheet ?? autoDetectStylesheet(projectRoot);
    const inputCss = stylesheet
      ? `@import "${path.resolve(projectRoot, stylesheet)}";`
      : '@import "tailwindcss";';

    const { build } = await tw.compile(inputCss, { base: projectRoot, loadStylesheet });
    const css = build(Array.from(classes));
    return parseCssToStyleMap(css);
  } catch (err) {
    throw new Error(
      `[imprint-tailwind] Tailwind compilation failed: ${String(err)}\n` +
        'Ensure tailwindcss is installed and options.tailwind.projectRoot points to your project.',
    );
  }
}
