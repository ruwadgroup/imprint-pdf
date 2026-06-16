import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Rewrites the HYPHEN_LANGUAGES literal array to match the JSON files in
// data/hyphen/. The `HyphenLanguage` union type is derived from the array.
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dataDir = join(root, 'data', 'hyphen');
const target = join(root, 'src', 'hyphen', 'index.ts');

const langs = readdirSync(dataDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

if (langs.length === 0) {
  console.error('[codegen-hyphen] no JSON files found in', dataDir);
  process.exit(1);
}

const lines = [
  '// codegen:hyphen-languages BEGIN — regenerate via `pnpm codegen`',
  'export const HYPHEN_LANGUAGES = [',
  ...langs.map((l) => `  '${l}',`),
  '] as const;',
  '// codegen:hyphen-languages END',
];

const source = readFileSync(target, 'utf8');
const begin = source.indexOf('// codegen:hyphen-languages BEGIN');
const endMarker = '// codegen:hyphen-languages END';
const end = source.indexOf(endMarker);
if (begin === -1 || end === -1) {
  console.error('[codegen-hyphen] could not find BEGIN/END markers in', target);
  process.exit(1);
}
const before = source.slice(0, begin);
const after = source.slice(end + endMarker.length);
const next = `${before}${lines.join('\n')}${after}`;

if (next === source) {
  console.log(`[codegen-hyphen] up to date (${langs.length} languages)`);
} else {
  writeFileSync(target, next);
  console.log(`[codegen-hyphen] wrote ${langs.length} languages to ${target}`);
}
