import { PDFDocument } from 'pdf-lib';
import { resolvePageDimensions } from '../layout/pages.js';
import type {
  AssetResolver,
  ComputedGeometry,
  DocumentNode,
  FontDeclaration,
  PageDefaults,
  PageNode,
} from '../types.js';
import { loadFonts } from '../typography/fonts.js';
import { drawNode } from './drawNode.js';
import { addOutline, collectBookmarks } from './outline.js';

export async function writePdf(
  document: DocumentNode,
  geometries: Map<string, ComputedGeometry>,
  fontDeclarations: FontDeclaration[],
  resolver: AssetResolver,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc, fontDeclarations, resolver);

  const { props } = document;
  if (props.title) doc.setTitle(props.title);
  if (props.author) doc.setAuthor(props.author);
  if (props.subject) doc.setSubject(props.subject);
  if (Array.isArray(props.keywords)) doc.setKeywords(props.keywords as string[]);

  const pageDefaults = document.props.pageDefaults as PageDefaults | undefined;
  for (const pageNode of document.children.filter((c): c is PageNode => c.type === 'page')) {
    const [pageWidth, pageHeight] = resolvePageDimensions(pageNode, pageDefaults);
    const page = doc.addPage([pageWidth, pageHeight]);
    await drawNode(pageNode, page, pageHeight, geometries, fonts, doc, resolver);
  }

  const bookmarks = collectBookmarks(document);
  if (bookmarks.length > 0) addOutline(doc, bookmarks, geometries);

  return doc.save();
}
