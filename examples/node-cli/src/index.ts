import { mkdir, writeFile } from 'node:fs/promises';
import { documents } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';

const OUT_DIR = new URL('../out/', import.meta.url);

await mkdir(OUT_DIR, { recursive: true });

for (const doc of documents) {
  const bytes = await pdf(doc.render(), { as: 'bytes' });
  await writeFile(new URL(`${doc.id}.pdf`, OUT_DIR), bytes);
  console.log(`  ✓  ${doc.id}.pdf  ${(bytes.byteLength / 1024).toFixed(1)} KB`);
}

console.log(`\n  ${documents.length} PDFs → ${OUT_DIR.pathname}\n`);
