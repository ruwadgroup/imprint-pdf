import type { PDFDocument, PDFPage } from 'pdf-lib';
import { type PDFDict, PDFHexString, PDFName, PDFNull, PDFNumber } from 'pdf-lib';
import type { BookmarkNode, DocumentNode, PdfNode } from '../types.js';

function collectBookmarks(node: PdfNode, result: BookmarkNode[] = []): BookmarkNode[] {
  if (node.type === 'bookmark') result.push(node as BookmarkNode);
  for (const child of node.children) collectBookmarks(child, result);
  return result;
}

interface BookmarkEntry {
  node: BookmarkNode;
  pageIndex: number;
}

function collectBookmarksWithPages(document: DocumentNode): BookmarkEntry[] {
  const result: BookmarkEntry[] = [];
  document.children
    .filter((c) => c.type === 'page')
    .forEach((pageNode, pageIndex) => {
      const bms = collectBookmarks(pageNode);
      for (const bm of bms) result.push({ node: bm, pageIndex });
    });
  return result;
}

export function addOutline(doc: PDFDocument, document: DocumentNode, pdfPages: PDFPage[]): void {
  const entries = collectBookmarksWithPages(document);
  if (entries.length === 0) return;

  try {
    const outlineDict = doc.context.obj({
      Type: PDFName.of('Outlines'),
      Count: entries.length,
    }) as PDFDict;
    const outlineRef = doc.context.register(outlineDict);
    doc.catalog.set(PDFName.of('Outlines'), outlineRef);

    let prevRef: ReturnType<typeof doc.context.register> | undefined;

    for (const { node: bm, pageIndex } of entries) {
      const pdfPage = pdfPages[pageIndex];
      const itemDict = doc.context.obj({
        Title: PDFHexString.fromText(bm.props.title ?? ''),
        Parent: outlineRef,
      }) as PDFDict;

      // PDF spec §12.3.2.2: [page /XYZ left top zoom]. Nulls preserve the
      // viewer's current left/top, so the bookmark scrolls to the page top
      // without zooming or recentering. Final 0 means "use current zoom".
      if (pdfPage) {
        const destArr = doc.context.obj([
          pdfPage.ref,
          PDFName.of('XYZ'),
          PDFNull,
          PDFNull,
          PDFNumber.of(0),
        ]);
        itemDict.set(PDFName.of('Dest'), destArr);
      }

      if (prevRef) itemDict.set(PDFName.of('Prev'), prevRef);
      const itemRef = doc.context.register(itemDict);
      if (prevRef) (doc.context.lookup(prevRef) as PDFDict).set(PDFName.of('Next'), itemRef);
      prevRef = itemRef;
    }
  } catch {
    // The outline is a navigation convenience — if we fail to build it the
    // document is still readable, just without bookmarks in the sidebar.
  }
}
