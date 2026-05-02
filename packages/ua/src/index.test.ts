import type { DocumentNode } from '@imprint/core';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { taggedPdf, validateUA } from './index.js';

function makeDocument(overrides: Partial<DocumentNode['props']> = {}): DocumentNode {
  return {
    type: 'document',
    id: 'doc',
    props: { title: 'Accessible PDF', lang: 'en', ...overrides } as DocumentNode['props'],
    style: {},
    children: [
      {
        type: 'page',
        id: 'p0',
        props: {},
        style: {},
        children: [
          {
            type: 'view',
            id: 'h-wrap',
            props: { 'data-tag': 'h1' } as Record<string, unknown>,
            style: {},
            children: [
              { type: 'text', id: 't0', props: {}, style: {}, children: [], text: 'Hello' },
            ] as DocumentNode['children'],
          },
          {
            type: 'image',
            id: 'img',
            props: { src: 'logo.png', alt: 'Acme' },
            style: {},
            children: [],
          },
        ] as DocumentNode['children'],
      },
    ],
  } as unknown as DocumentNode;
}

describe('validateUA', () => {
  it('passes when lang, title, and alt text are present', () => {
    const result = validateUA(makeDocument());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('flags missing lang and alt text', () => {
    const tree = makeDocument();
    delete (tree.props as Record<string, unknown>).lang;
    (tree.children[0]?.children[1] as { props: Record<string, unknown> }).props = {
      src: 'logo.png',
    };
    const result = validateUA(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('lang'))).toBe(true);
    expect(result.errors.some((e) => e.includes('alt'))).toBe(true);
  });
});

describe('taggedPdf', () => {
  it('writes Lang, MarkInfo, ViewerPreferences, and StructTreeRoot to the catalog', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 300]);
    const tree = makeDocument();

    const hook = taggedPdf();
    await hook({ doc, document: tree, pages: [page], geometries: new Map() });

    expect(doc.catalog.lookup(PDFName.of('Lang'))).toBeDefined();
    expect(doc.catalog.lookup(PDFName.of('MarkInfo'))).toBeInstanceOf(PDFDict);
    expect(doc.catalog.lookup(PDFName.of('ViewerPreferences'))).toBeInstanceOf(PDFDict);
    expect(doc.catalog.lookup(PDFName.of('StructTreeRoot'))).toBeInstanceOf(PDFDict);

    const bytes = await doc.save();
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.catalog.lookup(PDFName.of('StructTreeRoot'))).toBeDefined();
  });

  it('emits a Figure structure element for images with alt text', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 300]);
    const hook = taggedPdf();
    await hook({ doc, document: makeDocument(), pages: [page], geometries: new Map() });

    const root = doc.catalog.lookup(PDFName.of('StructTreeRoot'), PDFDict);
    const kRef = root.get(PDFName.of('K'));
    const docElem = (kRef instanceof PDFRef ? doc.context.lookup(kRef) : kRef) as PDFDict;
    expect(docElem).toBeInstanceOf(PDFDict);

    const figure = collectByRole(docElem, 'Figure', doc);
    expect(figure).toBeDefined();
    expect(figure?.lookup(PDFName.of('Alt'))).toBeDefined();
  });
});

function collectByRole(elem: PDFDict, role: string, doc: PDFDocument): PDFDict | undefined {
  const ctx = doc.context;
  const s = elem.get(PDFName.of('S'));
  const name = s instanceof PDFName ? s.asString() : undefined;
  if (name === `/${role}`) return elem;

  const kidsRaw = elem.get(PDFName.of('K'));
  const kids = kidsRaw instanceof PDFRef ? ctx.lookup(kidsRaw) : kidsRaw;
  if (kids instanceof PDFArray) {
    for (let i = 0; i < kids.size(); i++) {
      const entry = kids.get(i);
      const child = entry instanceof PDFRef ? ctx.lookup(entry) : entry;
      if (child instanceof PDFDict) {
        const found = collectByRole(child, role, doc);
        if (found) return found;
      }
    }
  } else if (kids instanceof PDFDict) {
    return collectByRole(kids, role, doc);
  }
  return undefined;
}
