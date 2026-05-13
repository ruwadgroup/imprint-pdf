import type { PDFDocument, PDFPage } from 'pdf-lib';
import { PDFArray, PDFName, PDFNull, PDFNumber, PDFString } from 'pdf-lib';
import type { ComputedGeometry, LinkNode } from '../types.js';
import { pdfY } from './coords.js';

export function drawLink(
  node: LinkNode,
  page: PDFPage,
  pageHeight: number,
  geo: ComputedGeometry,
  doc: PDFDocument,
  /** Map of lowercase anchor name → target PDFPage for #anchor hrefs. */
  namedDests?: Map<string, PDFPage>,
): void {
  const href = node.props.href;
  if (!href) return;
  const { x, y, width, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);

  const rectArr = PDFArray.withContext(doc.context);
  rectArr.push(doc.context.obj(x));
  rectArr.push(doc.context.obj(pdfYPos));
  rectArr.push(doc.context.obj(x + width));
  rectArr.push(doc.context.obj(pdfYPos + height));

  // `[H V W]` = horiz radius, vert radius, width. All zero so links don't get
  // boxed by default — matches what browsers do.
  const borderArr = doc.context.obj([0, 0, 0]);

  // `#anchor` resolves to a /Dest GoTo; everything else falls through to /URI.
  if (href.startsWith('#') && namedDests) {
    const anchor = href.slice(1).toLowerCase();
    const targetPage = namedDests.get(anchor);
    if (targetPage) {
      const destArr = doc.context.obj([
        targetPage.ref,
        PDFName.of('XYZ'),
        PDFNull,
        PDFNull,
        PDFNumber.of(0),
      ]);
      page.node.addAnnot(
        doc.context.register(
          doc.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Link'),
            Rect: rectArr,
            Border: borderArr,
            Dest: destArr,
          }),
        ),
      );
      return;
    }
  }

  page.node.addAnnot(
    doc.context.register(
      doc.context.obj({
        Type: PDFName.of('Annot'),
        Subtype: PDFName.of('Link'),
        Rect: rectArr,
        Border: borderArr,
        A: doc.context.obj({
          Type: PDFName.of('Action'),
          S: PDFName.of('URI'),
          URI: PDFString.of(href),
        }),
      }),
    ),
  );
}
