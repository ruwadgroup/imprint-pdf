import { z } from 'zod';

const FontDeclarationSchema = z.object({
  family: z.string(),
  src: z.string(),
  weight: z.union([z.number(), z.string()]).optional(),
  style: z.enum(['normal', 'italic']).optional(),
  format: z.enum(['woff2', 'woff', 'ttf', 'otf']).optional(),
});

const ImprintConfigSchema = z.object({
  fonts: z.array(FontDeclarationSchema).optional().default([]),
  tailwind: z
    .object({
      config: z.string().optional(),
      stylesheet: z.string().optional(),
    })
    .optional(),
  outDir: z.string().optional().default('out'),
  debug: z.boolean().optional().default(false),
});

export type ImprintConfigInput = z.input<typeof ImprintConfigSchema>;
export type ImprintConfig = z.output<typeof ImprintConfigSchema>;

export function defineConfig(config: ImprintConfigInput): ImprintConfig {
  return ImprintConfigSchema.parse(config);
}
