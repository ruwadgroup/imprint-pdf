/**
 * @imprint/print — print-ready PDF output for Imprint.
 *
 * Adds the catalog entries, output intents, and page geometry that a
 * commercial press RIP needs: PDF/X-4 conformance, ICC output profiles,
 * CMYK / spot colour spaces, bleed and trim boxes, registration marks,
 * and PDF/A-2/3 (including factur-X / ZUGFeRD e-invoicing).
 *
 * Plug into `renderToBuffer` via `printIntent({...})`:
 *
 * ```ts
 * import { renderToBuffer } from '@imprint/react';
 * import { printIntent } from '@imprint/print';
 *
 * const pdf = await renderToBuffer(element, {
 *   postProcess: [printIntent({
 *     intent: 'PDF/X-4',
 *     iccProfile: fogra39,
 *     conditionIdentifier: 'FOGRA39',
 *     bleed: '3mm',
 *     marks: ['trim', 'registration'],
 *   })],
 * });
 * ```
 *
 * Licensed under the Apache License, Version 2.0.
 */

import type { PdfPostProcessHook } from '@imprint/core';
import type { PDFDocument, PDFPage } from 'pdf-lib';
import { PDFName, PDFString } from 'pdf-lib';
import { type BleedBox, parseBleed } from './bleed.js';
import { applyPageBoxes, drawPrintMarks, type MarkKind } from './marks.js';
import { addOutputIntent, type OutputIntentOptions } from './output-intent.js';
import {
  type ApplyPdfAOptions,
  applyPdfA,
  type FacturXAttachment,
  type PdfAConformance,
} from './pdfa.js';

export type { BleedBox } from './bleed.js';
export { parseBleed } from './bleed.js';
export type { CmykColor } from './cmyk.js';
export { cmykOperator, parseCmykClass, rgbToCmyk } from './cmyk.js';
export type { DrawMarksOptions, MarkKind } from './marks.js';
export { applyPageBoxes, drawPrintMarks } from './marks.js';
export type { OutputIntentOptions, OutputIntentSubtype } from './output-intent.js';
export { addOutputIntent } from './output-intent.js';
export type { ApplyPdfAOptions, FacturXAttachment, PdfAConformance } from './pdfa.js';
export { applyPdfA } from './pdfa.js';
export type { SpotColor } from './spot.js';
export { defineSpotColor, embedOverprintState, embedSpotColorSpace } from './spot.js';

/** Top-level intent discriminator. PDF/X-4p references an external profile. */
export type PrintIntent =
  | 'PDF/X-4'
  | 'PDF/X-4p'
  | 'PDF/A-2B'
  | 'PDF/A-2U'
  | 'PDF/A-3B'
  | 'PDF/A-3U';

/** Props consumed by the `<Document>` running on a print pipeline. */
export interface PrintDocumentProps {
  intent?: PrintIntent;
  outputIntent?: Pick<
    OutputIntentOptions,
    | 'iccProfile'
    | 'iccComponents'
    | 'condition'
    | 'conditionIdentifier'
    | 'registry'
    | 'info'
    | 'externalProfileUri'
  >;
  facturX?: FacturXAttachment;
}

/** Per-page print options consumed by the `<Page>` running on a print pipeline. */
export interface PrintPageProps {
  /** Bleed amount as a CSS-like length (e.g. `"3mm"`, `"0.125in"`, `"3mm 5mm"`). */
  bleed?: string;
  /** Which marks to render in the bleed area. `'all'` is the prepress default. */
  marks?: MarkKind[] | MarkKind;
  /** Optional ICC profile override applied per-page (rare; mostly for spot-only pages). */
  colorProfile?: Uint8Array;
}

export interface PrintIntentOptions extends PrintDocumentProps {
  /** Default bleed applied to every page that doesn't override it. */
  bleed?: string;
  /** Default marks applied to every page that doesn't override them. */
  marks?: MarkKind[] | MarkKind;
}

/**
 * Builds a `postProcess` hook that applies the entire print intent (output
 * intent, page boxes, marks, PDF/A signature, factur-X attachment) to the
 * document before serialization.
 */
export function printIntent(options: PrintIntentOptions): PdfPostProcessHook {
  return async ({ doc, document, pages }) => {
    const pdfDoc = doc as PDFDocument;
    const subtype = options.intent?.startsWith('PDF/A') ? 'GTS_PDFA1' : 'GTS_PDFX';

    if (options.outputIntent || options.intent) {
      const oi = options.outputIntent ?? {};
      addOutputIntent(pdfDoc, {
        subtype,
        ...(oi.iccProfile && { iccProfile: oi.iccProfile }),
        ...(oi.iccComponents && { iccComponents: oi.iccComponents }),
        ...(oi.condition && { condition: oi.condition }),
        ...(oi.conditionIdentifier && { conditionIdentifier: oi.conditionIdentifier }),
        ...(oi.registry && { registry: oi.registry }),
        ...(oi.info && { info: oi.info }),
        ...(oi.externalProfileUri && { externalProfileUri: oi.externalProfileUri }),
      });
    }

    if (options.intent === 'PDF/X-4' || options.intent === 'PDF/X-4p') {
      stampPdfXMetadata(pdfDoc);
    }

    if (options.intent?.startsWith('PDF/A')) {
      const conformance = options.intent.slice('PDF/A-'.length) as PdfAConformance;
      const pdfaOptions: ApplyPdfAOptions = {
        conformance,
        ...(options.facturX && { facturX: options.facturX }),
      };
      applyPdfA(pdfDoc, pdfaOptions);
    }

    const pageNodes = document.children.filter((c) => c.type === 'page');
    for (let i = 0; i < pages.length; i++) {
      const pdfPage = pages[i] as PDFPage;
      const pageNode = pageNodes[i];
      if (!pdfPage || !pageNode) continue;

      const pageProps = pageNode.props as unknown as PrintPageProps;
      const bleedSpec = pageProps.bleed ?? options.bleed;
      const marksSpec = normalizeMarks(pageProps.marks ?? options.marks);

      if (!bleedSpec && marksSpec.length === 0) continue;

      const bleed: BleedBox = bleedSpec ? parseBleed(bleedSpec) : ZERO_BLEED;
      applyPageBoxes(pdfPage, bleed);
      if (marksSpec.length > 0) {
        drawPrintMarks(pdfPage, { bleed, marks: marksSpec });
      }
    }
  };
}

const ZERO_BLEED: BleedBox = { top: 0, right: 0, bottom: 0, left: 0 };

function normalizeMarks(input: MarkKind[] | MarkKind | undefined): MarkKind[] {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}

/**
 * PDF/X-4 mandates an `xmp:CreatorTool` and a `pdfxid:GTS_PDFXVersion` /
 * `pdfx:GTS_PDFXConformance` pair on the catalog (the values mirror what
 * Acrobat Distiller writes). veraPDF will refuse a file without them.
 */
function stampPdfXMetadata(doc: PDFDocument): void {
  const info = doc.context.trailerInfo.Info;
  if (info && 'set' in info) {
    (info as { set: (k: PDFName, v: PDFString) => void }).set(
      PDFName.of('GTS_PDFXVersion'),
      PDFString.of('PDF/X-4'),
    );
  }
}
