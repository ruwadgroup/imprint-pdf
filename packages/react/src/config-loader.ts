import type { FontDeclaration, RenderOptions } from '@imprint-pdf/core';

export interface ResolvedImprintConfig {
  fonts?: FontDeclaration[];
  tailwind?: {
    config?: string;
    stylesheet?: string;
    projectRoot?: string;
  };
}

// Best-effort dynamic-load of `imprint.config.{ts,js,mjs,cjs}` from the
// project root. Node only — edge runtimes lack `node:fs` / `node:url` and
// will fall through to the `{}` return, which is fine because users on edge
// pass options explicitly.
let cached: Promise<ResolvedImprintConfig> | undefined;

const CONFIG_CANDIDATES = [
  'imprint.config.ts',
  'imprint.config.js',
  'imprint.config.mjs',
  'imprint.config.cjs',
];

async function tryLoad(): Promise<ResolvedImprintConfig> {
  let fs: typeof import('node:fs') | undefined;
  let pathMod: typeof import('node:path') | undefined;
  let urlMod: typeof import('node:url') | undefined;
  try {
    fs = await import('node:fs');
    pathMod = await import('node:path');
    urlMod = await import('node:url');
  } catch {
    return {};
  }

  const cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
  for (const rel of CONFIG_CANDIDATES) {
    const abs = pathMod.join(cwd, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      const mod = (await import(urlMod.pathToFileURL(abs).href)) as {
        default?: ResolvedImprintConfig;
      } & ResolvedImprintConfig;
      const config = mod.default ?? mod;
      if (config && typeof config === 'object') return config;
    } catch {
      // try the next candidate
    }
  }
  return {};
}

export function loadImprintConfig(): Promise<ResolvedImprintConfig> {
  cached ??= tryLoad();
  return cached;
}

// Caller-supplied options win over config. Undefined values are stripped so
// downstream `exactOptionalPropertyTypes` is happy.
export async function mergeWithConfig(options: RenderOptions): Promise<RenderOptions> {
  const config = await loadImprintConfig();
  const merged: RenderOptions = { ...options };

  if (options.fonts === undefined && config.fonts !== undefined) {
    merged.fonts = config.fonts;
  }

  const callerTw = options.tailwind;
  const configTw = config.tailwind;
  if (callerTw || configTw) {
    const tw: NonNullable<RenderOptions['tailwind']> = {};
    const c = callerTw?.config ?? configTw?.config;
    if (c !== undefined) tw.config = c;
    const s = callerTw?.stylesheet ?? configTw?.stylesheet;
    if (s !== undefined) tw.stylesheet = s;
    tw.projectRoot =
      callerTw?.projectRoot ??
      configTw?.projectRoot ??
      (typeof process !== 'undefined' && process.cwd ? process.cwd() : '.');
    merged.tailwind = tw;
  }

  return merged;
}
