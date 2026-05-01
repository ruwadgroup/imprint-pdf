import { existsSync } from 'node:fs';
import { extname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { FontDeclaration } from '@imprint/core';
import type { FontProvider } from '../types.js';

export interface LocalFontFile {
  family: string;
  src: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

export interface LocalProviderOptions {
  baseDir?: string;
}

const FORMAT_BY_EXT: Record<string, FontDeclaration['format']> = {
  '.ttf': 'ttf',
  '.otf': 'otf',
  '.woff': 'woff',
  '.woff2': 'woff2',
};

export function localProvider(
  files: LocalFontFile[],
  opts: LocalProviderOptions = {},
): FontProvider {
  return {
    name: 'local',
    async load(): Promise<FontDeclaration[]> {
      return files.map((f) => {
        const abs = isAbsolute(f.src) ? f.src : resolve(opts.baseDir ?? process.cwd(), f.src);
        if (!existsSync(abs)) {
          throw new Error(`[imprint/font] local file not found: ${abs}`);
        }
        const format = FORMAT_BY_EXT[extname(abs).toLowerCase()];
        return {
          family: f.family,
          src: pathToFileURL(abs).toString(),
          weight: f.weight ?? 400,
          style: f.style ?? 'normal',
          ...(format ? { format } : {}),
        };
      });
    },
  };
}
