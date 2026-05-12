// `@imprint-pdf/next/plugin` — wraps next.config to inject WASM support, the
// imprint-pdf webpack plugin for compile-time Tailwind class extraction, and
// `serverExternalPackages` tweaks. Any pre-existing user config is preserved.
//
//   // next.config.ts
//   import { withImprint } from '@imprint-pdf/next/plugin'
//   export default withImprint({ fonts: [...] })(nextConfig)
//
// Turbopack falls through to the runtime Tailwind compile inside `pdf()` —
// no build-time plugin is needed.

import type { NextConfig } from 'next';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';

interface WebpackConfig {
  experiments?: Record<string, unknown>;
  module?: { rules?: unknown[] };
  plugins?: { apply(compiler: unknown): void }[];
  resolve?: { alias?: Record<string, string>; [key: string]: unknown };
  [key: string]: unknown;
}

export interface ImprintFontDef {
  family: string;
  src: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

export interface ImprintTailwindConfig {
  config?: string;
  stylesheet?: string;
  safelist?: string[];
  content?: string[];
}

export interface ImprintPluginOptions {
  fonts?: ImprintFontDef[];
  tailwind?: ImprintTailwindConfig;
  /** Verbose logging during webpack compilation. */
  debug?: boolean;
}

// Strip undefined keys so downstream `exactOptionalPropertyTypes` is happy.
function compactDefined<T extends object>(src: T | undefined): Partial<T> {
  if (!src) return {};
  const out: Partial<T> = {};
  for (const k of Object.keys(src) as (keyof T)[]) {
    if (src[k] !== undefined) out[k] = src[k];
  }
  return out;
}

/**
 * Wrap a Next.js config with imprint-pdf build-time support: WASM experiments
 * and the bundled `ImprintWebpackPlugin` for compile-time Tailwind class
 * extraction (webpack only — Turbopack falls back to the runtime compile in
 * `pdf()`).
 */
export function withImprint(pluginOptions: ImprintPluginOptions = {}) {
  return (nextConfig: NextConfig = {}): NextConfig => {
    // @imprint-pdf/* may pull in native bindings + uses `createContext` /
    // `node:fs` at module load — Next must externalise them so RSC compilation
    // doesn't bail. Set both keys: `serverExternalPackages` (Next 15+) and
    // `experimental.serverComponentsExternalPackages` (Next 14). Next warns
    // about unknown keys but doesn't error.
    const imprintExternals = ['@imprint-pdf/next', '@imprint-pdf/react', '@imprint-pdf/core'];
    const existingExperimental =
      (nextConfig as { experimental?: { serverComponentsExternalPackages?: string[] } })
        .experimental ?? {};

    return {
      ...nextConfig,

      serverExternalPackages: [...(nextConfig.serverExternalPackages ?? []), ...imprintExternals],

      experimental: {
        ...existingExperimental,
        serverComponentsExternalPackages: [
          ...(existingExperimental.serverComponentsExternalPackages ?? []),
          ...imprintExternals,
        ],
      },

      webpack(config: WebpackConfig, ctx: WebpackConfigContext) {
        config.experiments = {
          ...(config.experiments ?? {}),
          asyncWebAssembly: true,
          layers: true,
        };

        config.module ??= {};
        config.module.rules ??= [];
        config.module.rules.push({ test: /\.wasm$/, type: 'webassembly/async' });

        // `@imprint-pdf/tailwind/webpack` is inlined into this package's dist
        // via tsup `noExternal`, so the require resolves even if the consumer
        // hasn't installed `@imprint-pdf/tailwind` (it's a private workspace
        // package). The try/catch is defensive against future build changes.
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { ImprintWebpackPlugin } = require('@imprint-pdf/tailwind/webpack') as {
            ImprintWebpackPlugin: new (
              opts: ImprintTailwindConfig,
            ) => {
              apply(compiler: unknown): void;
            };
          };
          config.plugins ??= [];
          config.plugins.push(new ImprintWebpackPlugin(compactDefined(pluginOptions.tailwind)));
          if (pluginOptions.debug) console.info('[imprint] ImprintWebpackPlugin registered');
        } catch (err) {
          if (pluginOptions.debug) {
            console.warn('[imprint] Could not load ImprintWebpackPlugin:', String(err));
          }
        }

        // Run the user's own webpack hook last so they can override.
        return typeof nextConfig.webpack === 'function'
          ? (nextConfig.webpack(config, ctx) as WebpackConfig)
          : config;
      },
    } as NextConfig;
  };
}
