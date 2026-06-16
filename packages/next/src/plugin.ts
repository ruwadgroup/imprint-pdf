// `@imprint-pdf/next/plugin` — wraps next.config to add WASM support, the
// imprint webpack plugin for compile-time Tailwind class extraction, and
// `serverExternalPackages` tweaks. Pre-existing user config is preserved.
//
//   // next.config.ts
//   import { withImprint } from '@imprint-pdf/next/plugin'
//   export default withImprint({ fonts: [...] })(nextConfig)
//
// Turbopack uses the runtime Tailwind compile inside `pdf()` — no build-time
// plugin needed there.

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
  resolveAlias?: Record<string, string>;
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

// Strip undefined keys to keep `exactOptionalPropertyTypes` happy downstream.
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
 * extraction. Webpack only — Turbopack uses the runtime compile in `pdf()`.
 */
export function withImprint(pluginOptions: ImprintPluginOptions = {}) {
  return (nextConfig: NextConfig = {}): NextConfig => {
    // @imprint-pdf/* uses native bindings + `createContext` / `node:fs` at
    // module load, so Next must externalise them or RSC compilation bails.
    // Set both keys: `serverExternalPackages` (Next 15+) and
    // `experimental.serverComponentsExternalPackages` (Next 14). Next warns
    // on unknown keys but doesn't error.
    const imprintExternals = ['@imprint-pdf/next', '@imprint-pdf/react', '@imprint-pdf/core'];
    // We resolve the consumer's `tailwindcss` / `postcss` via
    // `createRequire(projectRoot)`, which nft can't statically follow. Marking
    // them external tells nft they're real runtime deps so they get traced
    // into `.next/standalone` even when the consumer left them in
    // `devDependencies` — otherwise renders fail with `Cannot find module
    // 'tailwindcss'`.
    const tailwindRuntime = ['tailwindcss', 'postcss'];
    const existingExperimental =
      (
        nextConfig as {
          experimental?: {
            serverComponentsExternalPackages?: string[];
            outputFileTracingIncludes?: Record<string, string[]>;
          };
        }
      ).experimental ?? {};

    return {
      ...nextConfig,

      turbopack: {
        ...((nextConfig as { turbopack?: TurbopackConfig }).turbopack ?? {}),
        resolveAlias: {
          ...((nextConfig as { turbopack?: TurbopackConfig }).turbopack?.resolveAlias ?? {}),
          'virtual:imprint-classes': '@imprint-pdf/tailwind/runtime',
        },
      },

      serverExternalPackages: [
        ...(nextConfig.serverExternalPackages ?? []),
        ...imprintExternals,
        ...tailwindRuntime,
      ],

      experimental: {
        ...existingExperimental,
        serverComponentsExternalPackages: [
          ...(existingExperimental.serverComponentsExternalPackages ?? []),
          ...imprintExternals,
          ...tailwindRuntime,
        ],
        // Belt-and-suspenders: explicit trace include so nft copies
        // `tailwindcss` / `postcss` even when consumer routes never import
        // them directly. Glob covers both root and pnpm `.pnpm/` layouts.
        outputFileTracingIncludes: {
          ...(existingExperimental.outputFileTracingIncludes ?? {}),
          '**/*': [
            ...((existingExperimental.outputFileTracingIncludes?.['**/*'] as string[]) ?? []),
            './node_modules/tailwindcss/**/*',
            './node_modules/postcss/**/*',
            './node_modules/.pnpm/tailwindcss@*/node_modules/tailwindcss/**/*',
            './node_modules/.pnpm/postcss@*/node_modules/postcss/**/*',
          ],
        },
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
        // via tsup `noExternal`, so the require resolves even though the
        // consumer never installs `@imprint-pdf/tailwind` (private workspace
        // package). try/catch is defensive against future build changes.
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
          if (pluginOptions.debug)
            console.warn('[imprint] Could not load ImprintWebpackPlugin:', String(err));
        }

        // Run the user's webpack hook last so they can override.
        return typeof nextConfig.webpack === 'function'
          ? (nextConfig.webpack(config, ctx) as WebpackConfig)
          : config;
      },
    } as NextConfig;
  };
}
