import type { FontDeclaration, RenderOptions } from '@imprint-pdf/core';

export interface ResolvedImprintConfig {
  fonts?: FontDeclaration[];
  tailwind?: {
    config?: string;
    stylesheet?: string;
    projectRoot?: string;
    runtimeFallback?: boolean;
    safelist?: string[];
    content?: string[];
  };
}

// Best-effort load of `imprint.config.{ts,js,mjs,cjs}` from the project root.
// Node-only; on edge runtimes `node:fs` / `node:url` aren't there and we fall
// through to `{}`, which is fine since edge callers pass options explicitly.
let cached: Promise<ResolvedImprintConfig> | undefined;

const CONFIG_CANDIDATES = [
  'imprint.config.ts',
  'imprint.config.js',
  'imprint.config.mjs',
  'imprint.config.cjs',
];

async function tryLoad(): Promise<ResolvedImprintConfig> {
  let fs: typeof import('node:fs');
  let pathMod: typeof import('node:path');
  let urlMod: typeof import('node:url');
  try {
    [fs, pathMod, urlMod] = await Promise.all([
      import('node:fs'),
      import('node:path'),
      import('node:url'),
    ]);
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
      // try next candidate
    }
  }
  return {};
}

export function loadImprintConfig(): Promise<ResolvedImprintConfig> {
  cached ??= tryLoad();
  return cached;
}

// Caller options win over config. Undefined keys are stripped to keep
// `exactOptionalPropertyTypes` happy downstream.
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
    const r = callerTw?.runtimeFallback ?? configTw?.runtimeFallback;
    if (r !== undefined) tw.runtimeFallback = r;
    const safelist = callerTw?.safelist ?? configTw?.safelist;
    if (safelist !== undefined) tw.safelist = safelist;
    const content = callerTw?.content ?? configTw?.content;
    if (content !== undefined) tw.content = content;
    tw.projectRoot =
      callerTw?.projectRoot ??
      configTw?.projectRoot ??
      (typeof process !== 'undefined' && process.cwd ? process.cwd() : '.');
    merged.tailwind = tw;
  }

  return merged;
}
