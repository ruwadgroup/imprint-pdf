import { z } from 'zod';

const FontDeclarationSchema = z.object({
  family: z.string(),
  src: z.string(),
  weight: z.union([z.number(), z.string()]).optional(),
  style: z.enum(['normal', 'italic']).optional(),
  format: z.enum(['woff2', 'woff', 'ttf', 'otf']).optional(),
  /** Variable font marker. Required for the runtime to expose font-variation-settings axes. */
  variable: z.boolean().optional(),
  /** Allowed axis ranges (e.g. `{ wght: [100, 900] }`). Only meaningful when `variable` is true. */
  axes: z.record(z.string(), z.tuple([z.number(), z.number()])).optional(),
});

const TailwindConfigSchema = z.object({
  config: z.string().optional(),
  stylesheet: z.string().optional(),
  /** Run the Tailwind compiler on every render instead of at build time. Slower (~5–20 ms/render) but works under Turbopack / unbundled runtimes. */
  runtimeFallback: z.boolean().optional(),
  /** Class names to always include in the compiled map even if not referenced by static analysis. */
  safelist: z.array(z.string()).optional(),
  /** Extra source globs to scan for class names (in addition to the framework defaults). */
  content: z.array(z.string()).optional(),
});

const TypographyConfigSchema = z.object({
  lineBreaking: z.enum(['knuth-plass', 'greedy']).optional(),
  hyphenation: z.record(z.string(), z.union([z.boolean(), z.string()])).optional(),
  defaultWidows: z.number().int().nonnegative().optional(),
  defaultOrphans: z.number().int().nonnegative().optional(),
  /** Disable HarfBuzz font subsetting (debug only — embeds the full font). */
  subset: z.boolean().optional(),
});

const OutputConfigSchema = z.object({
  intent: z.enum(['PDF/X-4', 'PDF/X-4p', 'PDF/A-2b', 'PDF/A-3']).optional(),
  outputIntent: z
    .object({
      profile: z.string(),
      condition: z.string().optional(),
    })
    .optional(),
  compress: z.boolean().optional(),
  version: z.enum(['1.7', '2.0']).optional(),
});

const AssetsConfigSchema = z.object({
  baseUrl: z.string().optional(),
  cacheDir: z.string().optional(),
});

const ImprintConfigSchema = z.object({
  fonts: z.array(FontDeclarationSchema).optional().default([]),
  tailwind: TailwindConfigSchema.optional(),
  typography: TypographyConfigSchema.optional(),
  output: OutputConfigSchema.optional(),
  assets: AssetsConfigSchema.optional(),
  outDir: z.string().optional().default('out'),
  debug: z.boolean().optional().default(false),
});

export type ImprintConfigInput = z.input<typeof ImprintConfigSchema>;
export type ImprintConfig = z.output<typeof ImprintConfigSchema>;

export function defineConfig(config: ImprintConfigInput): ImprintConfig {
  return ImprintConfigSchema.parse(config);
}
