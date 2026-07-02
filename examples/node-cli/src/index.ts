import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { documents } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';

const OUT_DIR = new URL('../out/', import.meta.url);
// This package's root resolves `tailwindcss`, so the renderer compiles the
// corpus's Tailwind classes against the default theme.
const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));

await mkdir(OUT_DIR, { recursive: true });

// Optional doc-id filter: `pnpm generate invoice receipt` renders just those.
const only = process.argv.slice(2);
const selected = only.length > 0 ? documents.filter((d) => only.includes(d.id)) : documents;
if (only.length > 0 && selected.length !== only.length) {
  const known = new Set(documents.map((d) => d.id));
  const unknown = only.filter((id) => !known.has(id));
  throw new Error(`Unknown document id(s): ${unknown.join(', ')}`);
}

for (const doc of selected) {
  const bytes = await pdf(doc.render(), {
    as: 'bytes',
    fonts: doc.fonts,
    tailwind: { projectRoot: PROJECT_ROOT },
  });
  await writeFile(new URL(`${doc.id}.pdf`, OUT_DIR), bytes);
  console.log(`  ✓  ${doc.id}.pdf  ${(bytes.byteLength / 1024).toFixed(1)} KB`);
}

console.log(`\n  ${selected.length} PDFs → ${OUT_DIR.pathname}\n`);
