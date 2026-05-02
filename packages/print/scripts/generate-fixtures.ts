/**
 * Generates the fixture PDFs that the veraPDF CI workflow validates.
 *
 * Outputs to `<repo>/fixtures/verapdf/<profile>/<name>.pdf` so the workflow
 * can run profile-specific validation passes without re-rendering.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { addOutputIntent, applyPdfA, printIntent } from '../src/index.js';
import { taggedPdf } from '../../ua/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../');
const OUT_BASE = resolve(ROOT, 'fixtures/verapdf');

const TINY_ICC = new Uint8Array(256);
TINY_ICC.set([0x43, 0x4d, 0x59, 0x4b], 16); // "CMYK"

async function makeBlank(): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  doc.setTitle('Imprint veraPDF fixture');
  doc.setAuthor('Imprint');
  doc.addPage([200, 300]);
  return doc;
}

async function emit(profile: string, name: string, doc: PDFDocument): Promise<void> {
  const dir = resolve(OUT_BASE, profile);
  await mkdir(dir, { recursive: true });
  const bytes = await doc.save();
  await writeFile(resolve(dir, `${name}.pdf`), bytes);
  console.log(`✓ ${profile}/${name}.pdf — ${bytes.length} bytes`);
}

async function pdfA2BFixture(): Promise<void> {
  const doc = await makeBlank();
  addOutputIntent(doc, {
    subtype: 'GTS_PDFA1',
    iccProfile: TINY_ICC,
    iccComponents: 4,
    condition: 'FOGRA39',
    conditionIdentifier: 'FOGRA39',
    registry: 'http://www.color.org',
  });
  applyPdfA(doc, { conformance: '2B' });
  await emit('pdfa-2b', 'minimal', doc);
}

async function pdfA3BFacturXFixture(): Promise<void> {
  const doc = await makeBlank();
  addOutputIntent(doc, {
    subtype: 'GTS_PDFA1',
    iccProfile: TINY_ICC,
    iccComponents: 4,
    condition: 'FOGRA39',
  });
  applyPdfA(doc, {
    conformance: '3B',
    facturX: {
      level: 'EN 16931',
      xml: new TextEncoder().encode('<?xml version="1.0"?><Invoice/>'),
    },
  });
  await emit('pdfa-3b', 'facturx-minimal', doc);
}

async function pdfUA1Fixture(): Promise<void> {
  const doc = await makeBlank();
  const page = doc.addPage([400, 600]);
  const hook = taggedPdf();
  await hook({
    doc,
    document: {
      type: 'document',
      id: 'doc',
      props: { lang: 'en', title: 'Imprint veraPDF fixture' },
      style: {},
      children: [
        {
          type: 'page',
          id: 'p0',
          props: {},
          style: {},
          children: [],
        },
      ],
      // biome-ignore lint/suspicious/noExplicitAny: tagged-tree fixture
    } as any,
    pages: [page],
    geometries: new Map(),
  });
  await emit('ua-1', 'minimal', doc);
}

async function pdfX4Fixture(): Promise<void> {
  const doc = await makeBlank();
  const hook = printIntent({
    intent: 'PDF/X-4',
    outputIntent: { iccProfile: TINY_ICC, iccComponents: 4, conditionIdentifier: 'FOGRA39' },
    bleed: '3mm',
    marks: ['trim', 'registration'],
  });
  await hook({
    doc,
    document: {
      type: 'document',
      id: 'doc',
      props: {},
      style: {},
      children: [
        {
          type: 'page',
          id: 'p0',
          props: { bleed: '3mm' },
          style: {},
          children: [],
        },
      ],
      // biome-ignore lint/suspicious/noExplicitAny: print-intent fixture
    } as any,
    pages: doc.getPages(),
    geometries: new Map(),
  });
  await emit('pdf-x-4', 'minimal', doc);
}

async function main(): Promise<void> {
  await Promise.all([pdfA2BFixture(), pdfA3BFacturXFixture(), pdfUA1Fixture(), pdfX4Fixture()]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
