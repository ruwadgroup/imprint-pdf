import type { PDFPage } from 'pdf-lib';
import { PDFDocument } from 'pdf-lib';
import { resolvePageDimensions } from '../layout/pages.js';
import { runTaffyLayout } from '../layout/taffy-adapter.js';
import type {
  AssetResolver,
  BookmarkNode,
  ComputedGeometry,
  DocumentNode,
  FontDeclaration,
  FooterNode,
  HeaderNode,
  PageDefaults,
  PageNode,
  PdfNode,
  WatermarkNode,
} from '../types.js';
import { loadFonts } from '../typography/fonts.js';
import { drawNode } from './drawNode.js';
import { addOutline } from './outline.js';

function collectBookmarks(node: PdfNode, result: BookmarkNode[] = []): BookmarkNode[] {
  if (node.type === 'bookmark') result.push(node as BookmarkNode);
  for (const child of node.children) collectBookmarks(child, result);
  return result;
}

/**
 * Builds the lookup table that resolves `<a href="#anchor">` to a target page.
 * Each bookmark contributes two keys — slug form (`my-section`) and verbatim
 * lowercase (`my section`) — so authors can link by either convention without
 * thinking about it.
 */
function buildNamedDests(document: DocumentNode, pdfPages: PDFPage[]): Map<string, PDFPage> {
  const map = new Map<string, PDFPage>();
  document.children
    .filter((c) => c.type === 'page')
    .forEach((pageNode, pageIndex) => {
      const page = pdfPages[pageIndex];
      if (!page) return;
      for (const bm of collectBookmarks(pageNode)) {
        const title = bm.props.title as string | undefined;
        if (title) {
          map.set(title.toLowerCase().replace(/\s+/g, '-'), page);
          map.set(title.toLowerCase(), page);
        }
      }
    });
  return map;
}

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

  const embeds = props.embeds as
    | Array<{ name: string; data: Uint8Array; mimeType: string; description?: string }>
    | undefined;
  if (Array.isArray(embeds)) {
    for (const embed of embeds) {
      try {
        await doc.attach(embed.data, embed.name, {
          mimeType: embed.mimeType,
          description: embed.description ?? embed.name,
          creationDate: new Date(),
          modificationDate: new Date(),
        });
      } catch {
        console.warn(`[imprint] Failed to attach file "${embed.name}"`);
      }
    }
  }

  const pageDefaults = document.props.pageDefaults as PageDefaults | undefined;

  const runningHeader = document.children.find((c) => c.type === 'header') as
    | HeaderNode
    | undefined;
  const runningFooter = document.children.find((c) => c.type === 'footer') as
    | FooterNode
    | undefined;
  const watermarkNode = document.children.find((c) => c.type === 'watermark') as
    | WatermarkNode
    | undefined;

  const pageNodes = document.children.filter((c): c is PageNode => c.type === 'page');
  const pdfPages: PDFPage[] = [];

  // Two-pass writing: allocate every page object before drawing anything so a
  // forward `<Link href="#later">` on page 1 can find page N's PDFPage in the
  // namedDests map. The PDF spec doesn't care about authoring order, but our
  // single-pass writer would.
  for (const pageNode of pageNodes) {
    const [pageWidth, pageHeight] = resolvePageDimensions(pageNode, pageDefaults);
    pdfPages.push(doc.addPage([pageWidth, pageHeight]));
  }

  const namedDests = buildNamedDests(document, pdfPages);

  for (let i = 0; i < pageNodes.length; i++) {
    const pageNode = pageNodes[i]!;
    const page = pdfPages[i]!;
    const [pageWidth, pageHeight] = resolvePageDimensions(pageNode, pageDefaults);

    // Stamping order matters: watermark sits behind page content, header and
    // footer sit on top so they aren't obscured. Each running element is
    // re-laid-out per page because page sizes can vary across the document.
    if (watermarkNode) {
      const wGeos = await runTaffyLayout(watermarkNode, pageWidth, pageHeight, fonts);
      await drawNode(watermarkNode, page, pageHeight, wGeos, fonts, doc, resolver, {}, namedDests);
    }

    await drawNode(pageNode, page, pageHeight, geometries, fonts, doc, resolver, {}, namedDests);

    if (runningHeader) {
      const hGeos = await runTaffyLayout(runningHeader, pageWidth, pageHeight, fonts);
      await drawNode(runningHeader, page, pageHeight, hGeos, fonts, doc, resolver, {}, namedDests);
    }

    if (runningFooter) {
      const fGeos = await runTaffyLayout(runningFooter, pageWidth, pageHeight, fonts);
      await drawNode(runningFooter, page, pageHeight, fGeos, fonts, doc, resolver, {}, namedDests);
    }
  }

  addOutline(doc, document, pdfPages);

  return doc.save();
}
