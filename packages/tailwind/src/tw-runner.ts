import type { ResolvedStyle } from '@imprint-pdf/core';
import { parseCssToStyleMap } from './css-to-styles.js';
import type { ImprintTailwindOptions } from './index.js';

// Node built-ins are loaded lazily so this module has no static `node:*` imports
// and can be bundled into the browser-facing `@imprint-pdf/react` entry without
// breaking browser builds. `runTailwind` only ever runs on Node (it needs a
// `projectRoot` on disk), so the dynamic import always resolves there.
interface NodeBuiltins {
  existsSync: (p: string) => boolean;
  readFileSync: (p: string, enc: 'utf8') => string;
  createRequire: (p: string) => NodeRequire;
  path: typeof import('node:path');
}

async function loadNodeBuiltins(): Promise<NodeBuiltins> {
  const [fs, mod, pathMod] = await Promise.all([
    import('node:fs'),
    import('node:module'),
    import('node:path'),
  ]);
  return {
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync as NodeBuiltins['readFileSync'],
    createRequire: mod.createRequire,
    path: pathMod.default ?? (pathMod as unknown as typeof import('node:path')),
  };
}

// Conventional v4 stylesheet / v3 config paths. First match wins.
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

function findFirstExisting(
  node: NodeBuiltins,
  projectRoot: string,
  candidates: string[],
): string | undefined {
  return candidates.find((rel) => node.existsSync(node.path.join(projectRoot, rel)));
}

// Tailwind v4 programmatic surface — only on `tailwindcss@>=4`.
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

// Read the consumer's `tailwindcss/package.json` to pick the dispatch branch.
function detectTailwindMajor(node: NodeBuiltins, projectRoot: string): 3 | 4 | null {
  try {
    const req = node.createRequire(node.path.join(projectRoot, 'package.json'));
    const pkg = JSON.parse(node.readFileSync(req.resolve('tailwindcss/package.json'), 'utf8')) as {
      version?: string;
    };
    const major = parseInt(String(pkg.version ?? '').split('.')[0] ?? '0', 10);
    return major === 3 || major === 4 ? major : null;
  } catch {
    return null;
  }
}

// Dispatch precedence:
//   1. options.config                                    → v3
//   2. options.stylesheet                                → v4
//   3. auto-detected v3 config + tailwindcss@3 installed → v3
//   4. fallback                                          → v4 (auto stylesheet or bare)
export async function runTailwind(
  classes: Set<string>,
  options: ImprintTailwindOptions,
  projectRoot: string,
): Promise<Map<string, ResolvedStyle>> {
  if (classes.size === 0) return new Map();

  const node = await loadNodeBuiltins();

  const v3ConfigPath =
    options.config ??
    (!options.stylesheet && detectTailwindMajor(node, projectRoot) === 3
      ? findFirstExisting(node, projectRoot, V3_CONFIG_AUTO_PATHS)
      : undefined);

  return v3ConfigPath
    ? runTailwindV3(node, classes, projectRoot, v3ConfigPath)
    : runTailwindV4(node, classes, options, projectRoot);
}

async function runTailwindV4(
  node: NodeBuiltins,
  classes: Set<string>,
  options: ImprintTailwindOptions,
  projectRoot: string,
): Promise<Map<string, ResolvedStyle>> {
  const { createRequire, readFileSync, path } = node;
  try {
    const req = createRequire(path.join(projectRoot, 'package.json'));
    // Literal-specifier `import()` so nft statically traces tailwindcss AND
    // its transitive deps (`@alloc/quick-lru`, `didyoumean`, `dlv`,
    // `picocolors`, ...) into `.next/standalone`. createRequire(projectRoot)
    // resolves at runtime but nft can't follow it, so consumer deploys would
    // fail with `Cannot find module '@alloc/quick-lru'`.
    //
    // v4 exposes `compile` on the namespace AND has a separate `default`
    // export (the v4 PostCSS plugin factory). Prefer the namespace; falling
    // back to `default` would grab the wrong function.
    const twMod = (await import('tailwindcss')) as unknown as Partial<TailwindV4> & {
      default?: TailwindV4;
    };
    const tw = (typeof twMod.compile === 'function' ? twMod : twMod.default) as TailwindV4;
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
      } catch {
        // not a package; fall through to a relative-path attempt
      }
      try {
        const abs = path.resolve(base, id);
        return { content: readFileSync(abs, 'utf8'), base: path.dirname(abs) };
      } catch {
        return { content: '', base };
      }
    }

    const stylesheet =
      options.stylesheet ?? findFirstExisting(node, projectRoot, STYLESHEET_AUTO_PATHS);
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

// Run the classic v3 PostCSS plugin against a stub
// `@tailwind base/components/utilities` stylesheet. The full class set is the
// `safelist` so Tailwind skips the filesystem scan — we already know every
// class the document uses. Needs `tailwindcss@3` and `postcss` in the
// consumer project (both optional peers).
async function runTailwindV3(
  node: NodeBuiltins,
  classes: Set<string>,
  projectRoot: string,
  configPath: string,
): Promise<Map<string, ResolvedStyle>> {
  const { createRequire, path } = node;
  try {
    const req = createRequire(path.join(projectRoot, 'package.json'));
    const absConfigPath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(projectRoot, configPath);

    // `.ts` configs go through Tailwind's own jiti loader; JS variants we
    // `require` directly and unwrap a possible `default` export.
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

    // See runTailwindV4: literal-specifier `await import()` so nft traces
    // tailwindcss's full subgraph (@alloc/quick-lru, picocolors, didyoumean,
    // dlv, jiti, postcss-import, fast-glob, ...) into the deploy artifact.
    const twV3Mod = (await import('tailwindcss')) as unknown as {
      default?: TailwindV3;
    } & TailwindV3;
    const tailwindV3 = (twV3Mod.default ?? twV3Mod) as TailwindV3;

    type PostCss = (plugins: unknown[]) => {
      process: (css: string, opts?: { from?: string | undefined }) => Promise<{ css: string }>;
    };
    const postcssMod = (await import('postcss')) as unknown as {
      default?: PostCss;
    } & PostCss;
    const postcss = (postcssMod.default ?? postcssMod) as PostCss;

    const stubCss = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
    const result = await postcss([tailwindV3(mergedConfig)]).process(stubCss, { from: undefined });
    return parseCssToStyleMap(result.css);
  } catch (err) {
    const msg = String(err);
    const isModuleNotFound = /Cannot find module '(tailwindcss|postcss)'/.test(msg);
    throw new Error(
      `[imprint-tailwind] Tailwind v3 compilation failed: ${msg}\n` +
        `Config: ${configPath}.\n` +
        (isModuleNotFound
          ? "On standalone builds (Next.js `output: 'standalone'`, Docker, etc.) " +
            '`tailwindcss` and `postcss` must be in `dependencies` (not `devDependencies`) ' +
            'OR the Next.js config must mark them external so nft traces them into ' +
            'the build artifact. `withImprint()` from `@imprint-pdf/next/plugin` ' +
            '(alpha.8+) does this automatically; for a manual fix, add ' +
            "`serverExternalPackages: ['tailwindcss', 'postcss']` to `next.config.js`."
          : 'Ensure tailwindcss@3 and postcss are installed in the consumer project.'),
    );
  }
}
