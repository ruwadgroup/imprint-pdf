import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export async function runValidate(file: string, options: { profile?: string }): Promise<void> {
  const absFile = resolve(file);

  if (!existsSync(absFile)) {
    console.error(`File not found: ${absFile}`);
    process.exit(1);
  }

  const bytes = readFileSync(absFile);

  // check magic bytes
  const header = bytes.subarray(0, 8).toString('ascii');
  if (!header.startsWith('%PDF-')) {
    console.error('✗ Not a valid PDF file (missing %PDF- header)');
    process.exit(1);
  }

  const pdfVersion = header.slice(5, 8);
  console.log(`✓ Valid PDF ${pdfVersion}`);

  const tail = bytes.subarray(Math.max(0, bytes.length - 1024)).toString('ascii');
  if (!tail.includes('%%EOF')) {
    console.warn('⚠ Missing %%EOF marker — file may be truncated or corrupt');
  } else {
    console.log('✓ EOF marker found');
  }

  if (tail.includes('xref') || tail.includes('startxref')) {
    console.log('✓ Cross-reference table detected');
  } else {
    console.warn('⚠ No cross-reference table found in last 1 KB of file');
  }

  console.log(`  File size: ${(bytes.length / 1024).toFixed(1)} KB`);

  if (options.profile) {
    console.log(
      `\n⚠ Profile validation (${options.profile}) requires @imprint-pdf/ua or @imprint-pdf/print`,
    );
    console.log('  Install the appropriate enterprise package for full compliance validation.');
    console.log('  e.g.: npm install @imprint-pdf/ua  (for PDF/UA-1)');
    console.log('        npm install @imprint-pdf/print (for PDF/X-4, PDF/A-2b)');
  }
}
