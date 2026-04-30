import type { PDFPage } from 'pdf-lib';
import { PDFDocument } from 'pdf-lib';
import { resolvePageDimensions } from '../layout/pages.js';
import { runTaffyLayout } from '../layout/taffy-adapter.js';
import type {
  AssetResolver,
  ComputedGeometry,
  DocumentNode,
  FontDeclaration,
  FooterNode,
  HeaderNode,
  PageDefaults,
  PageNode,
} from '../types.js';
import { loadFonts } from '../typography/fonts.js';
import { drawNode } from './drawNode.js';
import { addOutline } from './outline.js';

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

  // Running header/footer: direct children of <Document> with type header/footer
  const runningHeader = document.children.find((c) => c.type === 'header') as
    | HeaderNode
    | undefined;
  const runningFooter = document.children.find((c) => c.type === 'footer') as
    | FooterNode
    | undefined;

  const pageNodes = document.children.filter((c): c is PageNode => c.type === 'page');
  const pdfPages: PDFPage[] = [];

  for (const pageNode of pageNodes) {
    const [pageWidth, pageHeight] = resolvePageDimensions(pageNode, pageDefaults);
    const page = doc.addPage([pageWidth, pageHeight]);
    pdfPages.push(page);

    await drawNode(pageNode, page, pageHeight, geometries, fonts, doc, resolver);

    // Stamp running header on every page
    if (runningHeader) {
      const hGeos = await runTaffyLayout(runningHeader, pageWidth, pageHeight, fonts);
      await drawNode(runningHeader, page, pageHeight, hGeos, fonts, doc, resolver);
    }

    // Stamp running footer on every page
    if (runningFooter) {
      const fGeos = await runTaffyLayout(runningFooter, pageWidth, pageHeight, fonts);
      await drawNode(runningFooter, page, pageHeight, fGeos, fonts, doc, resolver);
    }
  }

  addOutline(doc, document, pdfPages);

  return doc.save();
}
