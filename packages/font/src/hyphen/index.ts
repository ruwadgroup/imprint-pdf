import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CompiledHyphenator, compileHyphenator, type HyphenPatternData } from './liang.js';

export type { CompiledHyphenator, HyphenPatternData } from './liang.js';

// codegen:hyphen-languages BEGIN — regenerate via `pnpm codegen`
export const HYPHEN_LANGUAGES = [
  'da',
  'de',
  'en-gb',
  'en-us',
  'es',
  'fi',
  'fr',
  'it',
  'nb',
  'nl',
  'pt',
  'sv',
] as const;
// codegen:hyphen-languages END

export type HyphenLanguage = (typeof HYPHEN_LANGUAGES)[number];

const cache = new Map<string, CompiledHyphenator>();

function dataDir(): string {
  // Built dist/ lives at the package root; src/ lives one level deeper. We
  // probe both because vitest runs us in src/ mode while consumers see dist/.
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    join(here, '..', 'data', 'hyphen'),
    join(here, '..', '..', 'data', 'hyphen'),
  ]) {
    try {
      readFileSync(join(candidate, 'en-us.json'), 'utf8');
      return candidate;
    } catch {}
  }
  throw new Error('[imprint/font] cannot locate hyphenation pattern data');
}

let _dataDir: string | null = null;

export function loadHyphenator(language: HyphenLanguage | string): CompiledHyphenator {
  const lower = language.toLowerCase();
  const hit = cache.get(lower);
  if (hit) return hit;

  if (_dataDir === null) _dataDir = dataDir();
  let raw: string;
  try {
    raw = readFileSync(join(_dataDir, `${lower}.json`), 'utf8');
  } catch {
    throw new Error(
      `[imprint/font] no hyphenation patterns bundled for language "${language}". ` +
        `Built-in: ${HYPHEN_LANGUAGES.join(', ')}.`,
    );
  }
  const compiled = compileHyphenator(JSON.parse(raw) as HyphenPatternData);
  cache.set(lower, compiled);
  return compiled;
}

export function hyphenate(word: string, language: HyphenLanguage | string): string[] {
  return loadHyphenator(language).hyphenate(word);
}

export function registerHyphenator(data: HyphenPatternData): CompiledHyphenator {
  const compiled = compileHyphenator(data);
  cache.set(data.id.toLowerCase(), compiled);
  return compiled;
}
