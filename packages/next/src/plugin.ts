// `@imprint-pdf/next/plugin` — wraps next.config to inject WASM support,
// the imprint-pdf webpack plugin, the Turbopack `virtual:imprint-classes`
// alias, and `serverExternalPackages` tweaks. Any pre-existing user config
// is preserved.
//
//   // next.config.ts
//   import { withImprint } from '@imprint-pdf/next/plugin'
//   export default withImprint({ fonts: [...] })(nextConfig)

import type { NextConfig } from 'next';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';

interface WebpackConfig {
  experiments?: Record<string, unknown>;
  module?: { rules?: unknown[] };
  plugins?: { apply(compiler: unknown): void }[];
  resolve?: { alias?: Record<string, string>; [key: string]: unknown };
  [key: string]: unknown;
}

interface TurbopackConfig {
  resolveAlias?: Record<string, string | string[]>;
  rules?: Record<string, unknown>;
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
 * Wrap a Next.js config with imprint-pdf build-time support: WASM experiments,
 * `ImprintWebpackPlugin` for compile-time Tailwind class extraction (webpack
 * only), and a Turbopack `resolveAlias` for `virtual:imprint-classes` so the
 * runtime Tailwind fallback works under Next 16's default bundler.
 */
export function withImprint(pluginOptions: ImprintPluginOptions = {}) {
  return (nextConfig: NextConfig = {}): NextConfig => {
    const existingTurbo = (nextConfig as { turbopack?: TurbopackConfig }).turbopack ?? {};
    const resolveAlias: Record<string, string | string[]> = {
      ...(existingTurbo.resolveAlias ?? {}),
    };
    resolveAlias['virtual:imprint-classes'] ??= '@imprint-pdf/tailwind/runtime';

    return {
      ...nextConfig,

      // @imprint-pdf/* may pull in native bindings — let Node require them directly.
      serverExternalPackages: [
        ...(nextConfig.serverExternalPackages ?? []),
        '@imprint-pdf/react',
        '@imprint-pdf/core',
      ],

      turbopack: { ...existingTurbo, resolveAlias },

      webpack(config: WebpackConfig, ctx: WebpackConfigContext) {
        config.experiments = {
          ...(config.experiments ?? {}),
          asyncWebAssembly: true,
          layers: true,
        };

        config.module ??= {};
        config.module.rules ??= [];
        config.module.rules.push({ test: /\.wasm$/, type: 'webassembly/async' });

        // Dynamic require keeps `@imprint-pdf/tailwind` an optional peer —
        // only resolved when the consumer has it installed.
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
            console.warn('[imprint] Could not load @imprint-pdf/tailwind/webpack:', String(err));
          }
        }

        config.resolve ??= {};
        config.resolve.alias ??= {};
        (config.resolve.alias as Record<string, string>)['virtual:imprint-classes'] =
          require.resolve('@imprint-pdf/tailwind/runtime');

        // Run the user's own webpack hook last so they can override.
        return typeof nextConfig.webpack === 'function'
          ? (nextConfig.webpack(config, ctx) as WebpackConfig)
          : config;
      },
    } as NextConfig;
  };
}
