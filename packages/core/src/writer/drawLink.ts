import type { PDFPage } from 'pdf-lib';
import { PDFArray, PDFName, PDFString } from 'pdf-lib';
import type { ComputedGeometry, LinkNode } from '../types.js';
import { pdfY } from './coords.js';

export function drawLink(
  node: LinkNode,
  page: PDFPage,
  pageHeight: number,
  geo: ComputedGeometry,
): void {
  const href = node.props.href;
  if (!href) return;
  const { x, y, width, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);

  const linkDict = page.doc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Link'),
    Rect: PDFArray.withContext(page.doc.context),
    Border: PDFArray.withContext(page.doc.context),
    A: page.doc.context.obj({
      Type: PDFName.of('Action'),
      S: PDFName.of('URI'),
      URI: PDFString.of(href),
    }),
  });
  const rectArr = linkDict.lookup(PDFName.of('Rect')) as PDFArray;
  rectArr.push(page.doc.context.obj(x));
  rectArr.push(page.doc.context.obj(pdfYPos));
  rectArr.push(page.doc.context.obj(x + width));
  rectArr.push(page.doc.context.obj(pdfYPos + height));
  const borderArr = linkDict.lookup(PDFName.of('Border')) as PDFArray;
  borderArr.push(page.doc.context.obj(0));
  borderArr.push(page.doc.context.obj(0));
  borderArr.push(page.doc.context.obj(0));
  page.node.addAnnot(page.doc.context.register(linkDict));
}
