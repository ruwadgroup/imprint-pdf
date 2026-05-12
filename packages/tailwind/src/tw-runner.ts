import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { ResolvedStyle } from '@imprint-pdf/core';
import { parseCssToStyleMap } from './css-to-styles.js';
import type { ImprintTailwindOptions } from './index.js';

// Conventional v4 stylesheet / v3 config locations. First match wins.
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
const V3_CONFIG_AUTO_PATHS = [
  'tailwind.config.ts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
];

function findFirstExisting(projectRoot: string, candidates: string[]): string | undefined {
  return candidates.find((rel) => existsSync(path.join(projectRoot, rel)));
}

// Tailwind v4 programmatic surface — only present on `tailwindcss@>=4`.
interface TailwindV4 {
  compile: (
    css: string,
    opts?: {
      base?: string;
      loadStylesheet?: (id: string, base: string) => Promise<{ content: string; base: string }>;
    },
  ) => Promise<{ build: (candidates: string[]) => string }>;
}

// v3 default export is a PostCSS plugin factory.
type TailwindV3 = (config: Record<string, unknown>) => unknown;

// Read the consumer's installed `tailwindcss/package.json` to pick the path.
function detectTailwindMajor(projectRoot: string): 3 | 4 | null {
  try {
    const req = createRequire(path.join(projectRoot, 'package.json'));
    const pkg = JSON.parse(readFileSync(req.resolve('tailwindcss/package.json'), 'utf8')) as {
      version?: string;
    };
    const major = parseInt(String(pkg.version ?? '').split('.')[0] ?? '0', 10);
    return major === 3 || major === 4 ? major : null;
  } catch {
    return null;
  }
}

// Dispatch precedence:
//   1. options.config        → v3
//   2. options.stylesheet    → v4
//   3. auto-detected v3 config + tailwindcss@3 installed → v3
//   4. otherwise             → v4 (auto-detected stylesheet or bare fallback)
export async function runTailwind(
  classes: Set<string>,
  options: ImprintTailwindOptions,
  projectRoot: string,
): Promise<Map<string, ResolvedStyle>> {
  if (classes.size === 0) return new Map();

  const v3ConfigPath =
    options.config ??
    (!options.stylesheet && detectTailwindMajor(projectRoot) === 3
      ? findFirstExisting(projectRoot, V3_CONFIG_AUTO_PATHS)
      : undefined);

  return v3ConfigPath
    ? runTailwindV3(classes, projectRoot, v3ConfigPath)
    : runTailwindV4(classes, options, projectRoot);
}

async function runTailwindV4(
  classes: Set<string>,
  options: ImprintTailwindOptions,
  projectRoot: string,
): Promise<Map<string, ResolvedStyle>> {
  try {
    const req = createRequire(path.join(projectRoot, 'package.json'));
    const tw = req('tailwindcss') as TailwindV4;
    const twDir = path.dirname(req.resolve('tailwindcss/package.json'));

    async function loadStylesheet(
      id: string,
      base: string,
    ): Promise<{ content: string; base: string }> {
      if (id === 'tailwindcss') {
        return { content: readFileSync(path.join(twDir, 'index.css'), 'utf8'), base: twDir };
      }
      try {
        const pkgDir = path.dirname(req.resolve(`${id}/package.json`));
        return { content: readFileSync(path.join(pkgDir, 'index.css'), 'utf8'), base: pkgDir };
      } catch {}
      try {
        const abs = path.resolve(base, id);
        return { content: readFileSync(abs, 'utf8'), base: path.dirname(abs) };
      } catch {}
      return { content: '', base };
    }

    const stylesheet = options.stylesheet ?? findFirstExisting(projectRoot, STYLESHEET_AUTO_PATHS);
    const inputCss = stylesheet
      ? `@import "${path.resolve(projectRoot, stylesheet)}";`
      : '@import "tailwindcss";';

    const { build } = await tw.compile(inputCss, { base: projectRoot, loadStylesheet });
    return parseCssToStyleMap(build(Array.from(classes)));
  } catch (err) {
    throw new Error(
      `[imprint-tailwind] Tailwind v4 compilation failed: ${String(err)}\n` +
        'Ensure tailwindcss>=4 is installed and options.tailwind.projectRoot points to your project.',
    );
  }
}

// Runs the classic v3 PostCSS plugin against a stub
// `@tailwind base/components/utilities` stylesheet. The full class set is
// passed as `safelist` so Tailwind doesn't scan the filesystem — we already
// know every class the document uses. Requires `tailwindcss@3` AND `postcss`
// installed in the consumer project (both optional peers).
async function runTailwindV3(
  classes: Set<string>,
  projectRoot: string,
  configPath: string,
): Promise<Map<string, ResolvedStyle>> {
  try {
    const req = createRequire(path.join(projectRoot, 'package.json'));
    const absConfigPath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(projectRoot, configPath);

    // `.ts` configs go through Tailwind's own jiti loader; for JS variants we
    // can `require` directly and unwrap a possible `default` export.
    let userConfig: Record<string, unknown> = { content: { relative: true, files: [] } };
    if (!absConfigPath.endsWith('.ts')) {
      const loaded = req(absConfigPath) as
        | Record<string, unknown>
        | { default: Record<string, unknown> };
      userConfig =
        loaded && typeof loaded === 'object' && 'default' in loaded
          ? (loaded as { default: Record<string, unknown> }).default
          : (loaded as Record<string, unknown>);
    }

    const safelist = Array.from(classes);
    const mergedConfig: Record<string, unknown> = {
      ...userConfig,
      content: { files: [{ raw: safelist.join(' '), extension: 'html' }] },
      safelist,
    };

    const tailwindV3 = req('tailwindcss') as TailwindV3;
    const postcss = req('postcss') as (plugins: unknown[]) => {
      process: (css: string, opts?: { from?: string | undefined }) => Promise<{ css: string }>;
    };

    const stubCss = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
    const result = await postcss([tailwindV3(mergedConfig)]).process(stubCss, { from: undefined });
    return parseCssToStyleMap(result.css);
  } catch (err) {
    throw new Error(
      `[imprint-tailwind] Tailwind v3 compilation failed: ${String(err)}\n` +
        `Config: ${configPath}. Ensure tailwindcss@3 and postcss are installed in the consumer project.`,
    );
  }
}
