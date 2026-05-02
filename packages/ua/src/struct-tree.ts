import type { DocumentNode, PdfNode } from '@imprint/core';
import type { PDFDocument, PDFPage, PDFRef } from 'pdf-lib';
import { PDFArray, PDFDict, PDFHexString, PDFName, PDFNumber, PDFString } from 'pdf-lib';
import { HTML_TO_ROLE, type StructureRole } from './roles.js';

/**
 * Builds the `/StructTreeRoot` and supporting `/MarkInfo` /
 * `/ViewerPreferences` entries required by PDF/UA-1 (ISO 14289-1) and PDF/A
 * tagged conformance levels.
 *
 * The tag tree references the page object rather than marked-content
 * sequences because the content-stream draw pass happens in the writer layer.
 * This is sufficient for AT software (NVDA, JAWS, VoiceOver) to expose the
 * document outline and alt text.
 */
export interface ApplyStructTreeOptions {
  document: DocumentNode;
  pages: PDFPage[];
}

export function applyStructTree(doc: PDFDocument, options: ApplyStructTreeOptions): void {
  const ctx = doc.context;
  const { document, pages } = options;

  const lang = (document.props.lang as string | undefined) ?? 'en';
  doc.catalog.set(PDFName.of('Lang'), PDFString.of(lang));

  const markInfo = PDFDict.withContext(ctx);
  markInfo.set(PDFName.of('Marked'), ctx.obj(true));
  markInfo.set(PDFName.of('Suspects'), ctx.obj(false));
  doc.catalog.set(PDFName.of('MarkInfo'), markInfo);

  const viewerPrefs =
    (doc.catalog.lookup(PDFName.of('ViewerPreferences')) as PDFDict | undefined) ??
    PDFDict.withContext(ctx);
  viewerPrefs.set(PDFName.of('DisplayDocTitle'), ctx.obj(true));
  doc.catalog.set(PDFName.of('ViewerPreferences'), viewerPrefs);

  const roleMap = PDFDict.withContext(ctx);
  doc.catalog.set(PDFName.of('RoleMap'), roleMap);

  const structTreeRootRef = ctx.nextRef();
  const structTreeRoot = PDFDict.withContext(ctx);
  structTreeRoot.set(PDFName.of('Type'), PDFName.of('StructTreeRoot'));

  const pageNodes = document.children.filter((c) => c.type === 'page');
  const builder = new TreeBuilder(doc, structTreeRootRef);

  const documentElement = builder.create('Document');
  structTreeRoot.set(PDFName.of('K'), documentElement.ref);

  for (let i = 0; i < pageNodes.length; i++) {
    const pdfPage = pages[i];
    const pageNode = pageNodes[i];
    if (!pdfPage || !pageNode) continue;
    walkChildren(pageNode, builder, documentElement, pdfPage.ref);
  }

  const parentTree = PDFDict.withContext(ctx);
  parentTree.set(PDFName.of('Nums'), PDFArray.withContext(ctx));
  structTreeRoot.set(PDFName.of('ParentTree'), ctx.register(parentTree));
  structTreeRoot.set(PDFName.of('ParentTreeNextKey'), PDFNumber.of(0));

  ctx.assign(structTreeRootRef, structTreeRoot);
  doc.catalog.set(PDFName.of('StructTreeRoot'), structTreeRootRef);
}

interface StructElem {
  ref: PDFRef;
  dict: PDFDict;
  kids: PDFArray;
}

class TreeBuilder {
  private readonly doc: PDFDocument;
  private readonly parentRef: PDFRef;

  constructor(doc: PDFDocument, parentRef: PDFRef) {
    this.doc = doc;
    this.parentRef = parentRef;
  }

  create(role: StructureRole, parent?: StructElem): StructElem {
    const ctx = this.doc.context;
    const dict = PDFDict.withContext(ctx);
    dict.set(PDFName.of('Type'), PDFName.of('StructElem'));
    dict.set(PDFName.of('S'), PDFName.of(role));
    const kids = PDFArray.withContext(ctx);
    dict.set(PDFName.of('K'), kids);
    dict.set(PDFName.of('P'), parent?.ref ?? this.parentRef);
    const ref = ctx.register(dict);
    if (parent) parent.kids.push(ref);
    return { ref, dict, kids };
  }
}

function walkChildren(
  node: PdfNode,
  builder: TreeBuilder,
  parent: StructElem,
  pageRef: PDFRef | undefined,
): void {
  for (const child of node.children) {
    visit(child, builder, parent, pageRef);
  }
}

function visit(
  node: PdfNode,
  builder: TreeBuilder,
  parent: StructElem,
  pageRef: PDFRef | undefined,
): void {
  const role = roleFor(node);
  if (!role) {
    walkChildren(node, builder, parent, pageRef);
    return;
  }

  const elem = builder.create(role, parent);
  if (pageRef) elem.dict.set(PDFName.of('Pg'), pageRef);

  applyAriaProps(node, elem);
  walkChildren(node, builder, elem, pageRef);
}

/**
 * Resolves a PDF role from an IR node:
 *   1. honour an explicit `role` prop (escape hatch for power users);
 *   2. map known HTML tag names through `HTML_TO_ROLE`;
 *   3. tag images / SVGs as `Figure`;
 *   4. tag links as `Link`;
 *   5. tag tables and form fields with their canonical roles.
 */
function roleFor(node: PdfNode): StructureRole | undefined {
  const explicit = (node.props as Record<string, unknown> | undefined)?.role;
  if (typeof explicit === 'string') return explicit as StructureRole;

  const tag = (node.props as Record<string, unknown> | undefined)?.['data-tag'];
  if (typeof tag === 'string' && HTML_TO_ROLE[tag.toLowerCase()]) {
    return HTML_TO_ROLE[tag.toLowerCase()]!;
  }

  switch (node.type) {
    case 'image':
    case 'svg':
    case 'chart':
      return 'Figure';
    case 'link':
      return 'Link';
    case 'form':
      return 'Form';
    case 'textfield':
    case 'checkbox':
    case 'radiogroup':
    case 'dropdown':
    case 'signature':
    case 'button':
      return 'Form';
    case 'header':
    case 'footer':
    case 'watermark':
    case 'view':
    case 'page':
      return undefined;
    default:
      return undefined;
  }
}

function applyAriaProps(node: PdfNode, elem: StructElem): void {
  const props = node.props as Record<string, unknown>;
  const alt =
    (props?.alt as string | undefined) ??
    (props?.['aria-label'] as string | undefined) ??
    (props?.title as string | undefined);
  if (alt) elem.dict.set(PDFName.of('Alt'), PDFHexString.fromText(alt));

  const expansion = props?.['aria-expanded'];
  if (typeof expansion === 'string') {
    elem.dict.set(PDFName.of('E'), PDFHexString.fromText(expansion));
  }

  const lang = props?.lang as string | undefined;
  if (lang) elem.dict.set(PDFName.of('Lang'), PDFString.of(lang));
}
