/**
 * Returns one array of {text, x, y, width, fontSize} per PDF page. Baseline y
 * is in PDF y-up coordinates. Use these for "same-baseline" wrapping checks
 * and column-alignment assertions.
 */

interface PdfTextItem {
  str: string;
  width: number;
  height: number;
  /** transform = [a, b, c, d, e, f]; (e, f) is the baseline position. */
  transform: number[];
  fontHeight: number;
}

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
}

let pdfjsCached: typeof import('pdfjs-dist/legacy/build/pdf.mjs') | undefined;

async function getPdfjs() {
  if (pdfjsCached) return pdfjsCached;
  // pdfjs-dist's `legacy` entry is the only build that runs under node
  // without a DOMMatrix shim — the modern build assumes a browser environment.
  pdfjsCached = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsCached;
}

export async function extractText(pdf: Uint8Array): Promise<TextItem[][]> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({
    data: pdf,
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: false,
  }).promise;

  const pages: TextItem[][] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // pdfjs inserts phantom whitespace runs between adjacent text operators —
    // strip them so tests assert on visible content, not synthesized spacers.
    const items: TextItem[] = (content.items as unknown as PdfTextItem[])
      .filter((it) => 'str' in it && it.str.trim().length > 0)
      .map((it) => ({
        text: it.str,
        x: it.transform[4]!,
        y: it.transform[5]!,
        width: it.width,
        fontSize: Math.abs(it.transform[3]!),
      }));
    pages.push(items);
  }

  await doc.cleanup();
  return pages;
}

export function flattenPageText(items: TextItem[]): string {
  return items.map((i) => i.text).join(' ');
}
