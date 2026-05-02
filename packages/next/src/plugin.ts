// ---------------------------------------------------------------------------
// @imprint-pdf/next/plugin — Next.js config wrapper
//
// Wraps the user's next.config.ts to inject WASM support, the imprint-pdf webpack
// plugin, and optional serverExternalPackages tweaks.
//
// Usage:
//   // next.config.ts
//   import { withImprint } from '@imprint-pdf/next/plugin'
//
//   export default withImprint({
//     fonts: [{ family: 'Inter', src: './public/fonts/Inter.ttf' }],
//     // tailwind.stylesheet is auto-detected from src/app.css, app/globals.css,
//     // etc. — only set it explicitly if your CSS entry lives elsewhere.
//   })(nextConfig)
// ---------------------------------------------------------------------------

import type { NextConfig } from 'next';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';

interface WebpackConfig {
  experiments?: Record<string, unknown>;
  module?: { rules?: unknown[] };
  plugins?: { apply(compiler: unknown): void }[];
  resolve?: { alias?: Record<string, string>; [key: string]: unknown };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  /**
   * Enable verbose logging during webpack compilation.
   * @default false
   */
  debug?: boolean;
}

// ---------------------------------------------------------------------------
// withImprint
// ---------------------------------------------------------------------------

/**
 * Wrap a Next.js config with imprint-pdf build-time support.
 *
 * This adds:
 * - `asyncWebAssembly: true` experiment (required for the PDF renderer)
 * - `layers: true` experiment (required by Next.js server/client splits)
 * - The `ImprintWebpackPlugin` for compile-time Tailwind extraction
 * - Any pre-existing webpack config from the user is preserved and called last
 */
export function withImprint(pluginOptions: ImprintPluginOptions = {}) {
  return (nextConfig: NextConfig = {}): NextConfig => ({
    ...nextConfig,

    // -------------------------------------------------------------------
    // serverExternalPackages: prevent Next.js from bundling heavy native
    // dependencies that are only used server-side.
    // -------------------------------------------------------------------
    serverExternalPackages: [
      ...(nextConfig.serverExternalPackages ?? []),
      // @imprint-pdf/react may pull in native bindings — exclude from
      // server-side bundling so Node can require them directly.
      '@imprint-pdf/react',
      '@imprint-pdf/core',
    ],

    // -------------------------------------------------------------------
    // webpack
    // -------------------------------------------------------------------
    webpack(config: WebpackConfig, ctx: WebpackConfigContext) {
      // 1. Enable WASM experiments
      config.experiments = {
        ...(config.experiments ?? {}),
        asyncWebAssembly: true,
        layers: true,
      };

      // 2. Ensure .wasm files are handled properly
      config.module ??= {};
      config.module.rules ??= [];
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async',
      });

      // 3. Add ImprintWebpackPlugin for Tailwind class extraction.
      //    We use a dynamic require here so that webpack itself remains an
      //    optional peer dependency of @imprint-pdf/next — it is only resolved
      //    at build time when the user's Next.js project has it installed.
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ImprintWebpackPlugin } = require('@imprint-pdf/tailwind/webpack') as {
          ImprintWebpackPlugin: new (
            opts: ImprintTailwindConfig,
          ) => { apply(compiler: unknown): void };
        };
        config.plugins ??= [];
        // Build options object, omitting undefined values to satisfy
        // exactOptionalPropertyTypes in @imprint-pdf/tailwind.
        const twOpts: ImprintTailwindConfig = {};
        if (pluginOptions.tailwind?.config !== undefined)
          twOpts.config = pluginOptions.tailwind.config;
        if (pluginOptions.tailwind?.stylesheet !== undefined)
          twOpts.stylesheet = pluginOptions.tailwind.stylesheet;
        if (pluginOptions.tailwind?.safelist !== undefined)
          twOpts.safelist = pluginOptions.tailwind.safelist;
        if (pluginOptions.tailwind?.content !== undefined)
          twOpts.content = pluginOptions.tailwind.content;
        config.plugins.push(new ImprintWebpackPlugin(twOpts));

        if (pluginOptions.debug) {
          console.info('[imprint] ImprintWebpackPlugin registered');
        }
      } catch (err) {
        // @imprint-pdf/tailwind might not be installed — degrade gracefully
        if (pluginOptions.debug) {
          console.warn('[imprint] Could not load @imprint-pdf/tailwind/webpack:', String(err));
        }
      }

      // 4. Alias virtual module so webpack can resolve it
      config.resolve ??= {};
      config.resolve.alias ??= {};
      const alias = config.resolve.alias as Record<string, string>;
      alias['virtual:imprint-classes'] = require.resolve('@imprint-pdf/tailwind/runtime');

      // 5. Call the user's own webpack config last so they can override
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, ctx) as WebpackConfig;
      }

      return config;
    },
  });
}
