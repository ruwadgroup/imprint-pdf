import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { HmrContext, Plugin, ResolvedConfig } from 'vite';
import type { ImprintTailwindOptions } from './index.js';
import { runTailwind } from './tw-runner.js';

const VIRTUAL_MODULE_ID = 'virtual:imprint-classes';
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_MODULE_ID}`;

const STATIC_CLASS_RE = /className\s*=\s*["']([^"']+)["']/g;
const TEMPLATE_CLASS_RE = /className\s*=\s*\{`([^`${}]+)`\}/g;
const EXPRESSION_STRING_RE = /className\s*=\s*\{["']([^"']+)["']\}/g;

function extractClasses(code: string): string[] {
  const found: string[] = [];
  for (const re of [STATIC_CLASS_RE, TEMPLATE_CLASS_RE, EXPRESSION_STRING_RE]) {
    re.lastIndex = 0;
    let match = re.exec(code);
    while (match !== null) {
      if (match[1]) {
        for (const cls of match[1].split(/\s+/)) {
          if (cls) found.push(cls);
        }
      }
      match = re.exec(code);
    }
  }
  return found;
}

function scanDir(dir: string, exts: string[]): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (
        entry.startsWith('.') ||
        entry === 'node_modules' ||
        entry === 'dist' ||
        entry === 'build'
      )
        continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        files.push(...scanDir(full, exts));
      } else if (exts.some((e) => full.endsWith(e))) {
        files.push(full);
      }
    }
  } catch {
    // unreadable — skip
  }
  return files;
}

export function imprintTailwind(options: ImprintTailwindOptions = {}): Plugin {
  const classSet = new Set<string>();
  let projectRoot = process.cwd();
  let debug = false;
  let cachedModule: string | null = null;

  function addClasses(code: string): boolean {
    let added = false;
    for (const cls of extractClasses(code)) {
      if (!classSet.has(cls)) {
        classSet.add(cls);
        added = true;
      }
    }
    return added;
  }

  for (const cls of options.safelist ?? []) {
    for (const c of cls.split(/\s+/)) {
      if (c) classSet.add(c);
    }
  }

  return {
    name: 'imprint-tailwind',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      projectRoot = config.root;
      debug = config.logLevel === 'info' || Boolean(process.env.IMPRINT_DEBUG);
    },

    buildStart() {
      const exts = ['.tsx', '.ts', '.jsx', '.js'];
      const roots = options.content
        ? options.content.map((p) => path.resolve(projectRoot, p))
        : [path.join(projectRoot, 'src'), projectRoot];

      for (const dir of roots) {
        for (const file of scanDir(dir, exts)) {
          try {
            addClasses(readFileSync(file, 'utf8'));
          } catch {
            // skip unreadable
          }
        }
      }

      cachedModule = null;

      if (debug) console.info(`[imprint-tailwind] pre-scan complete — ${classSet.size} classes`);
    },

    transform(code: string, id: string) {
      if (!/\.[jt]sx?$/.test(id) || id.includes('node_modules')) return null;
      if (addClasses(code)) cachedModule = null;
      return null;
    },

    resolveId(id: string) {
      return id === VIRTUAL_MODULE_ID ? RESOLVED_VIRTUAL_ID : null;
    },

    async load(id: string) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      if (cachedModule !== null) return cachedModule;

      const styleMap = await runTailwind(classSet, options, projectRoot);
      if (debug) console.info(`[imprint-tailwind] resolved ${styleMap.size} classes`);

      const classMap: Record<string, unknown> = {};
      for (const [cls, style] of styleMap) {
        classMap[cls] = style;
      }

      cachedModule = [
        `export const classMap = ${JSON.stringify(classMap)};`,
        `export const classList = ${JSON.stringify(Array.from(classSet))};`,
      ].join('\n');

      return cachedModule;
    },

    handleHotUpdate({ file, server }: HmrContext) {
      if (!/\.[jt]sx?$/.test(file) || file.includes('node_modules')) return;
      try {
        if (addClasses(readFileSync(file, 'utf8'))) {
          cachedModule = null;
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
          if (mod) server.moduleGraph.invalidateModule(mod);
        }
      } catch {
        // skip
      }
    },
  };
}
