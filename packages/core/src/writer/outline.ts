import type { PDFDocument } from 'pdf-lib';
import { type PDFDict, PDFHexString, PDFName } from 'pdf-lib';
import type { BookmarkNode, ComputedGeometry, PdfNode } from '../types.js';

export function collectBookmarks(node: PdfNode, result: BookmarkNode[] = []): BookmarkNode[] {
  if (node.type === 'bookmark') result.push(node as BookmarkNode);
  for (const child of node.children) collectBookmarks(child, result);
  return result;
}

export function addOutline(
  doc: PDFDocument,
  bookmarks: BookmarkNode[],
  _geometries: Map<string, ComputedGeometry>,
): void {
  if (bookmarks.length === 0) return;
  try {
    const outlineDict = doc.context.obj({ Type: PDFName.of('Outlines'), Count: bookmarks.length });
    const outlineRef = doc.context.register(outlineDict);
    doc.catalog.set(PDFName.of('Outlines'), outlineRef);
    let prevRef: ReturnType<typeof doc.context.register> | undefined;
    for (const bm of bookmarks) {
      const itemDict = doc.context.obj({
        Title: PDFHexString.fromText(bm.props.title ?? ''),
        Parent: outlineRef,
      }) as PDFDict;
      if (prevRef) itemDict.set(PDFName.of('Prev'), prevRef);
      const itemRef = doc.context.register(itemDict);
      if (prevRef) (doc.context.lookup(prevRef) as PDFDict).set(PDFName.of('Next'), itemRef);
      prevRef = itemRef;
    }
  } catch {
    /* non-critical */
  }
}
