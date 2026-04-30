import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { ResolvedStyle } from '@imprint/core';
import { parseCssToStyleMap } from './css-to-styles.js';
import type { ImprintTailwindOptions } from './index.js';

// Tailwind v4 JS API — matches `tailwindcss@>=4.0.0` peer dep
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
    const req = createRequire(path.join(projectRoot, 'package.json'));
    const tw = req('tailwindcss') as TailwindV4;
    const twDir = path.dirname(req.resolve('tailwindcss/package.json'));

    // loadStylesheet resolves @import statements during Tailwind compilation.
    // Bare specifiers like "tailwindcss" map to their package CSS entry.
    async function loadStylesheet(
      id: string,
      base: string,
    ): Promise<{ content: string; base: string }> {
      if (id === 'tailwindcss') {
        const cssPath = path.join(twDir, 'index.css');
        return { content: readFileSync(cssPath, 'utf8'), base: twDir };
      }
      // Try resolving as a bare package name with /index.css
      try {
        const pkgDir = path.dirname(req.resolve(`${id}/package.json`));
        const cssPath = path.join(pkgDir, 'index.css');
        return { content: readFileSync(cssPath, 'utf8'), base: pkgDir };
      } catch {}
      // Fall back to relative path resolution
      try {
        const abs = path.resolve(base, id);
        return { content: readFileSync(abs, 'utf8'), base: path.dirname(abs) };
      } catch {}
      return { content: '', base };
    }

    const inputCss = options.stylesheet
      ? `@import "${path.resolve(projectRoot, options.stylesheet)}";`
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
