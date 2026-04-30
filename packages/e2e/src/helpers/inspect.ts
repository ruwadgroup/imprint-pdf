import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef } from 'pdf-lib';

export interface PageInfo {
  index: number;
  width: number;
  height: number;
  annotationCount: number;
  annotationSubtypes: string[];
}

/**
 * Structural assertions ("N pages", "Link on page 2") without needing pdfjs.
 */
export async function inspect(
  pdf: Uint8Array,
): Promise<{ pages: PageInfo[]; pageCount: number; hasOutline: boolean; hasAcroForm: boolean }> {
  const doc = await PDFDocument.load(pdf);
  const pages: PageInfo[] = doc.getPages().map((page, index) => {
    const annots = page.node.lookup(PDFName.of('Annots'));
    const subtypes: string[] = [];
    if (annots instanceof PDFArray) {
      for (let i = 0; i < annots.size(); i++) {
        const ref = annots.get(i);
        const dict = ref instanceof PDFRef ? doc.context.lookup(ref, PDFDict) : (ref as PDFDict);
        const subtype = dict?.lookup(PDFName.of('Subtype'));
        if (subtype) subtypes.push(subtype.toString().replace(/^\//, ''));
      }
    }
    const { width, height } = page.getSize();
    return {
      index,
      width,
      height,
      annotationCount: subtypes.length,
      annotationSubtypes: subtypes,
    };
  });
  const hasOutline = doc.catalog.get(PDFName.of('Outlines')) !== undefined;
  const hasAcroForm = doc.catalog.get(PDFName.of('AcroForm')) !== undefined;
  return { pages, pageCount: pages.length, hasOutline, hasAcroForm };
}
