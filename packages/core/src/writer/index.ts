import type { PDFPage } from 'pdf-lib';
import { PDFDocument } from 'pdf-lib';
import { resolvePageDimensions } from '../layout/pages.js';
import { runTaffyLayout } from '../layout/taffy-adapter.js';
import { substitutePageMarkers } from '../style/variants.js';
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
  PdfPostBytesHook,
  PdfPostProcessHook,
  WatermarkNode,
} from '../types.js';
import { loadFonts } from '../typography/fonts.js';
import { drawNode } from './drawNode.js';
import { addOutline } from './outline.js';
import { addXmpMetadata } from './xmp.js';

export interface WritePdfOptions {
  /** Hooks invoked with the live `PDFDocument` before serialization. */
  postProcess?: PdfPostProcessHook[];
  /** Hooks invoked on the serialized byte buffer. */
  postBytes?: PdfPostBytesHook[];
  /** Fail-soft image/SVG fetch handler — see `RenderOptions.onAssetError`. */
  onAssetError?: import('../types.js').RenderOptions['onAssetError'];
}

function collectBookmarks(node: PdfNode, result: BookmarkNode[] = []): BookmarkNode[] {
  if (node.type === 'bookmark') result.push(node as BookmarkNode);
  for (const child of node.children) collectBookmarks(child, result);
  return result;
}

// Each bookmark contributes two keys — slug (`my-section`) and verbatim
// lowercase (`my section`) — so `<a href="#…">` resolves either way.
function buildNamedDests(document: DocumentNode, pdfPages: PDFPage[]): Map<string, PDFPage> {
  const map = new Map<string, PDFPage>();
  document.children
    .filter((c) => c.type === 'page')
    .forEach((pageNode, pageIndex) => {
      const page = pdfPages[pageIndex];
      if (!page) return;
      for (const bm of collectBookmarks(pageNode)) {
        const title = bm.props.title as string | undefined;
        if (!title) continue;
        map.set(title.toLowerCase().replace(/\s+/g, '-'), page);
        map.set(title.toLowerCase(), page);
      }
    });
  return map;
}

export async function writePdf(
  document: DocumentNode,
  geometries: Map<string, ComputedGeometry>,
  fontDeclarations: FontDeclaration[],
  resolver: AssetResolver,
  options: WritePdfOptions = {},
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

  // Allocate every page object before drawing so forward
  // `<Link href="#later">` on page 1 can find page N in namedDests.
  for (const pageNode of pageNodes) {
    const [pageWidth, pageHeight] = resolvePageDimensions(pageNode, pageDefaults);
    pdfPages.push(doc.addPage([pageWidth, pageHeight]));
  }

  const namedDests = buildNamedDests(document, pdfPages);
  const totalPages = pageNodes.length;

  // Running elements (watermark/header/footer) are re-laid-out per page
  // because page sizes can vary, and re-cloned so per-page `<PageNumber>` /
  // `<TotalPages>` markers resolve to the right values.
  async function drawRunning(
    template: PdfNode,
    page: PDFPage,
    pageWidth: number,
    pageHeight: number,
    pageIndex: number,
  ): Promise<void> {
    const cloned = substitutePageMarkers(template, pageIndex, totalPages);
    const geos = await runTaffyLayout(cloned, pageWidth, pageHeight, fonts);
    await drawNode(
      cloned,
      page,
      pageHeight,
      geos,
      fonts,
      doc,
      resolver,
      {},
      namedDests,
      options.onAssetError,
    );
  }

  for (let i = 0; i < pageNodes.length; i++) {
    const pageNode = pageNodes[i]!;
    const page = pdfPages[i]!;
    const [pageWidth, pageHeight] = resolvePageDimensions(pageNode, pageDefaults);

    // Watermark renders below content; header/footer above.
    if (watermarkNode) await drawRunning(watermarkNode, page, pageWidth, pageHeight, i);
    await drawNode(
      pageNode,
      page,
      pageHeight,
      geometries,
      fonts,
      doc,
      resolver,
      {},
      namedDests,
      options.onAssetError,
    );
    if (runningHeader) await drawRunning(runningHeader, page, pageWidth, pageHeight, i);
    if (runningFooter) await drawRunning(runningFooter, page, pageWidth, pageHeight, i);
  }

  addOutline(doc, document, pdfPages);
  addXmpMetadata(doc, document);

  if (options.postProcess?.length) {
    for (const hook of options.postProcess) {
      await hook({ doc, document, pages: pdfPages, geometries });
    }
  }

  let bytes = await doc.save();
  if (options.postBytes?.length) {
    for (const hook of options.postBytes) {
      bytes = await hook(bytes);
    }
  }
  return bytes;
}
