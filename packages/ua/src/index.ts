/**
 * @imprint/ua — Tagged PDF / PDF/UA-1 (ISO 14289-1) support.
 *
 * Plug into `renderToBuffer` via `taggedPdf()`:
 *
 * ```ts
 * import { renderToBuffer } from '@imprint/react';
 * import { taggedPdf } from '@imprint/ua';
 *
 * const pdf = await renderToBuffer(<Document lang="en">…</Document>, {
 *   postProcess: [taggedPdf()],
 * });
 * ```
 *
 * Licensed under the Apache License, Version 2.0.
 */

import type { PdfPostProcessHook } from '@imprint/core';
import type { PDFDocument, PDFPage } from 'pdf-lib';
import { applyStructTree } from './struct-tree.js';

export type { StructureRole } from './roles.js';
export { HTML_TO_ROLE } from './roles.js';
export type { ApplyStructTreeOptions } from './struct-tree.js';
export { applyStructTree } from './struct-tree.js';
export type { UAValidationResult } from './validate.js';
export { isTextLeaf, validateUA, validateUAConformance } from './validate.js';

/** Document-level props consumed when `<Document>` runs on the UA pipeline. */
export interface UADocumentProps {
  /** BCP-47 language tag required by PDF/UA-1 §7.2 (e.g. `"en"`, `"fr-CA"`). */
  lang?: string;
  /**
   * Forces viewers to render `/Title` instead of the file name. PDF/UA-1
   * §7.1 mandates this be set to `true`; defaults to `true` when this hook
   * is registered.
   */
  displayDocTitle?: boolean;
}

/**
 * Builds a `postProcess` hook that emits the structure tree, role map, and
 * `MarkInfo`/`ViewerPreferences`/`Lang` catalog entries required for
 * PDF/UA-1.
 *
 * The reconciler-level alt text walker `validateUA` should be run alongside
 * (e.g. as a pre-render warning step) — `taggedPdf` itself is permissive and
 * never throws on missing alt text; that lives in `validateUA`.
 */
export function taggedPdf(): PdfPostProcessHook {
  return async ({ doc, document, pages }) => {
    applyStructTree(doc as PDFDocument, {
      document,
      pages: pages as PDFPage[],
    });
  };
}
