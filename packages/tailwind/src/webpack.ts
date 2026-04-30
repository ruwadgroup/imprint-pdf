import type { Compilation, Compiler } from 'webpack';
import type { ImprintTailwindOptions } from './index.js';
import { runTailwind } from './tw-runner.js';

// NormalModule is typed loosely because @types/webpack may not include it
type NormalModule = {
  originalSource?: () => { source(): string | Buffer } | null;
  resource?: string;
};

const STATIC_CLASS_RE = /className\s*=\s*["']([^"']+)["']/g;
const TEMPLATE_CLASS_RE = /className\s*=\s*\{`([^`${}]+)`\}/g;
const EXPRESSION_STRING_RE = /className\s*=\s*\{["']([^"']+)["']\}/g;

function extractClasses(source: string): string[] {
  const found: string[] = [];
  const extract = (re: RegExp) => {
    re.lastIndex = 0;
    let match = re.exec(source);
    while (match !== null) {
      if (match[1]) {
        for (const cls of match[1].split(/\s+/)) {
          if (cls) found.push(cls);
        }
      }
      match = re.exec(source);
    }
  };
  extract(STATIC_CLASS_RE);
  extract(TEMPLATE_CLASS_RE);
  extract(EXPRESSION_STRING_RE);
  return found;
}

class ImprintWebpackPlugin {
  private readonly options: ImprintTailwindOptions;
  private readonly classSet: Set<string>;

  constructor(options: ImprintTailwindOptions = {}) {
    this.options = options;
    this.classSet = new Set<string>();
    if (options.safelist) {
      for (const cls of options.safelist) {
        for (const c of cls.split(/\s+/)) {
          if (c) this.classSet.add(c);
        }
      }
    }
  }

  apply(compiler: Compiler): void {
    const pluginName = 'ImprintTailwindPlugin';
    const { webpack } = compiler;
    const debug = Boolean(process.env.IMPRINT_DEBUG);
    // Resolve project root from the compiler context
    const projectRoot = compiler.context ?? process.cwd();

    compiler.hooks.thisCompilation.tap(pluginName, (compilation: Compilation) => {
      compilation.hooks.succeedModule.tap(pluginName, (rawMod) => {
        const mod = rawMod as NormalModule;
        const resource = mod.resource ?? '';
        if (!resource || !/\.[jt]sx?$/.test(resource) || resource.includes('node_modules')) return;
        const src = mod.originalSource?.()?.source();
        if (typeof src === 'string') {
          for (const cls of extractClasses(src)) this.classSet.add(cls);
        }
      });

      compilation.hooks.processAssets.tapPromise(
        { name: pluginName, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE },
        async () => {
          const styleMap = await runTailwind(this.classSet, this.options, projectRoot);

          if (debug) {
            console.info(`[imprint-tailwind] resolved ${styleMap.size} classes`);
          }

          const classMap: Record<string, unknown> = {};
          for (const [cls, style] of styleMap) {
            classMap[cls] = style;
          }

          const content = [
            `export const classMap = ${JSON.stringify(classMap)};`,
            `export const classList = ${JSON.stringify(Array.from(this.classSet))};`,
          ].join('\n');

          const { RawSource } = webpack.sources;
          compilation.emitAsset('imprint-classes.js', new RawSource(content));
        },
      );
    });

    new webpack.NormalModuleReplacementPlugin(
      /^virtual:imprint-classes$/,
      'imprint-classes.js',
    ).apply(compiler);
  }
}

export function withImprintTailwind(options: ImprintTailwindOptions = {}) {
  return (config: Record<string, unknown>): Record<string, unknown> => {
    const plugins = ((config.plugins as unknown[]) ?? []).slice();
    plugins.push(new ImprintWebpackPlugin(options));
    return { ...config, plugins };
  };
}

export { ImprintWebpackPlugin };
