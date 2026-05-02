import type { DocumentNode } from '@imprint/core';
import { PDFArray, PDFDocument, PDFName } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { parseBleed } from './bleed.js';
import { cmykOperator, parseCmykClass, rgbToCmyk } from './cmyk.js';
import { printIntent } from './index.js';
import { applyPageBoxes } from './marks.js';
import { addOutputIntent } from './output-intent.js';
import { applyPdfA } from './pdfa.js';
import { defineSpotColor, embedOverprintState, embedSpotColorSpace } from './spot.js';

describe('cmyk', () => {
  it('rgbToCmyk handles primary red', () => {
    expect(rgbToCmyk('#ff0000')).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });

  it('rgbToCmyk handles black via the K shortcut', () => {
    expect(rgbToCmyk('#000000')).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it('parseCmykClass accepts four percent values', () => {
    expect(parseCmykClass('100,0,0,0')).toEqual({ c: 100, m: 0, y: 0, k: 0 });
  });

  it('parseCmykClass rejects malformed values', () => {
    expect(parseCmykClass('100,0,0')).toBeNull();
    expect(parseCmykClass('a,b,c,d')).toBeNull();
    expect(parseCmykClass('100,0,0,200')).toBeNull();
  });

  it('cmykOperator emits four 0–1 floats followed by K', () => {
    expect(cmykOperator({ c: 50, m: 100, y: 0, k: 25 })).toBe('0.5000 1.0000 0.0000 0.2500 K');
  });
});

describe('bleed', () => {
  it('parses single-value shorthand', () => {
    const b = parseBleed('3mm');
    expect(b.top).toBeCloseTo(8.5, 1);
    expect(b.left).toBeCloseTo(8.5, 1);
  });

  it('parses two-value shorthand', () => {
    const b = parseBleed('3mm 6mm');
    expect(b.top).toBeCloseTo(8.5, 1);
    expect(b.right).toBeCloseTo(17, 1);
  });

  it('honours alternative units', () => {
    const inches = parseBleed('0.125in');
    expect(inches.top).toBeCloseTo(9, 1);
    const points = parseBleed('9pt');
    expect(points.top).toBe(9);
  });
});

describe('output intent', () => {
  it('registers an OutputIntents catalog entry', async () => {
    const doc = await PDFDocument.create();
    const profile = new Uint8Array(256);
    profile.set([0x43, 0x4d, 0x59, 0x4b], 16);
    addOutputIntent(doc, {
      subtype: 'GTS_PDFX',
      iccProfile: profile,
      condition: 'FOGRA39',
      conditionIdentifier: 'FOGRA39',
      registry: 'http://www.color.org',
    });

    const intents = doc.catalog.lookup(PDFName.of('OutputIntents'), PDFArray);
    expect(intents.size()).toBe(1);
  });
});

describe('spot colors', () => {
  it('embeds a Separation color space and matching ExtGState', async () => {
    const doc = await PDFDocument.create();
    const pantone = defineSpotColor('PANTONE 485 C', { c: 0, m: 100, y: 100, k: 0 });
    const csRef = embedSpotColorSpace(doc, pantone);
    const opRef = embedOverprintState(doc);
    expect(csRef).toBeDefined();
    expect(opRef).toBeDefined();
  });
});

describe('page boxes', () => {
  it('grows the MediaBox and pins a TrimBox at the trim corners', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 300]);
    applyPageBoxes(page, { top: 8.5, right: 8.5, bottom: 8.5, left: 8.5 });

    const media = page.getMediaBox();
    expect(media.width).toBeCloseTo(217, 0);
    expect(media.height).toBeCloseTo(317, 0);

    const trim = page.getTrimBox();
    expect(trim.x).toBeCloseTo(8.5, 1);
    expect(trim.width).toBe(200);
  });
});

describe('pdf/a', () => {
  it('marks a document as PDF/A-3B and embeds factur-X', async () => {
    const doc = await PDFDocument.create();
    doc.setTitle('Invoice 42');
    doc.addPage([200, 300]);

    applyPdfA(doc, {
      conformance: '3B',
      facturX: {
        level: 'EN 16931',
        xml: new TextEncoder().encode('<?xml version="1.0"?><Invoice/>'),
      },
    });

    const af = doc.catalog.lookup(PDFName.of('AF'));
    expect(af).toBeInstanceOf(PDFArray);
    const markInfo = doc.catalog.lookup(PDFName.of('MarkInfo'));
    expect(markInfo).toBeDefined();
  });
});

describe('printIntent hook', () => {
  it('returns a PdfPostProcessHook callable with a live PDFDocument', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 300]);
    const tree: DocumentNode = {
      type: 'document',
      id: 'root',
      props: {},
      style: {},
      children: [
        {
          type: 'page',
          id: 'p0',
          props: { bleed: '3mm' } as Record<string, unknown>,
          style: {},
          children: [],
        },
      ],
    } as unknown as DocumentNode;

    const hook = printIntent({ intent: 'PDF/X-4', bleed: '3mm', marks: ['trim'] });
    await hook({ doc, document: tree, pages: [page], geometries: new Map() });

    const media = page.getMediaBox();
    expect(media.width).toBeGreaterThan(200);
  });

  it('round-trips bytes through pdf-lib after the hook runs', async () => {
    const doc = await PDFDocument.create();
    doc.setTitle('Round trip');
    doc.addPage([200, 300]);
    addOutputIntent(doc, {
      subtype: 'GTS_PDFX',
      iccProfile: new Uint8Array(256),
      iccComponents: 4,
      condition: 'FOGRA39',
    });
    const bytes = await doc.save();
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toMatch(/^%PDF-/);

    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.catalog.lookup(PDFName.of('OutputIntents'))).toBeInstanceOf(PDFArray);
  });
});
