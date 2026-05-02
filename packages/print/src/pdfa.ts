import { buildXmpPacket } from '@imprint-pdf/core';
import type { PDFDocument } from 'pdf-lib';
import { PDFArray, PDFDict, PDFHexString, PDFName, PDFRawStream, PDFString } from 'pdf-lib';

/**
 * PDF/A conformance levels supported by Imprint.
 *
 * - **2b** — visual reproduction; the most lenient level.
 * - **2u** — adds Unicode mapping (every glyph round-trips to text).
 * - **3b/3u** — same as 2 but allows arbitrary file attachments (factur-X /
 *   ZUGFeRD / EN 16931 e-invoicing rely on this).
 */
export type PdfAConformance = '2B' | '2U' | '3B' | '3U';

export interface ApplyPdfAOptions {
  conformance: PdfAConformance;
  /** Marks an attached file as the document's primary data — required for factur-X. */
  facturX?: FacturXAttachment;
}

export interface FacturXAttachment {
  /**
   * Conformance level set in the XMP packet's `fx:ConformanceLevel`. Drives
   * what an EN 16931 / factur-X reader expects in the embedded XML.
   */
  level: 'MINIMUM' | 'BASIC WL' | 'BASIC' | 'EN 16931' | 'EXTENDED' | 'XRECHNUNG';
  /** XML payload (e.g. `factur-x.xml`). */
  xml: Uint8Array;
  /** File name as it should appear in the embedded files dict; defaults to `factur-x.xml`. */
  filename?: string;
  /**
   * Document version — currently only `1.0` is widely deployed. Embedded into
   * the XMP packet's `fx:DocumentFileName` / `fx:Version` keys.
   */
  version?: string;
}

/**
 * Marks an existing pdf-lib `PDFDocument` as a PDF/A-2 or PDF/A-3.
 *
 * Adds `/MarkInfo`, `/StructTreeRoot` (empty if none was wired), and an XMP
 * conformance signature (`pdfaid:part` and `pdfaid:conformance`) inside the
 * existing `/Metadata` stream. PDF/A-3 additionally annotates each embedded
 * file with `/AFRelationship` so a reader can locate the primary data file.
 *
 * Callers must independently embed an output intent via `addOutputIntent` —
 * PDF/A is undefined without one.
 */
export function applyPdfA(doc: PDFDocument, options: ApplyPdfAOptions): void {
  const ctx = doc.context;
  const part = options.conformance.startsWith('2') ? '2' : '3';
  const conformance = options.conformance.slice(1);

  if (!doc.catalog.lookup(PDFName.of('MarkInfo'))) {
    const markInfo = PDFDict.withContext(ctx);
    markInfo.set(PDFName.of('Marked'), ctx.obj(true));
    doc.catalog.set(PDFName.of('MarkInfo'), markInfo);
  }

  upgradeXmpForPdfA(doc, part, conformance, options.facturX);

  if (part === '3' && options.facturX) {
    embedFacturXAttachment(doc, options.facturX);
  }
}

/**
 * pdf-lib already emits a `/Metadata` stream populated by `addXmpMetadata`.
 * For PDF/A we need to splice three additional namespaces / keys into the
 * existing RDF Description, *before* the closing tag, without re-parsing.
 *
 * The patch is a string-level replace because the rest of the toolchain
 * agrees on the exact wrapper layout used by `buildXmpPacket`.
 */
function upgradeXmpForPdfA(
  doc: PDFDocument,
  part: '2' | '3',
  conformance: string,
  facturX: FacturXAttachment | undefined,
): void {
  const metaRef = doc.catalog.get(PDFName.of('Metadata'));
  let original: string;
  if (metaRef) {
    const stream = doc.context.lookup(metaRef);
    if (!(stream instanceof PDFRawStream)) return;
    original = new TextDecoder().decode(stream.contents);
  } else {
    // No XMP packet has been written yet (callers using applyPdfA on a raw
    // pdf-lib document rather than through writePdf land here). Synthesize
    // one from the Info dict so we have something to splice into.
    original = buildXmpPacket(infoDictToXmpInput(doc));
  }
  const facturXLines = facturX
    ? [
        ` xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"`,
        ` xmlns:zf="urn:ferd:pdfa:CrossIndustryDocument:invoice:1p0#"`,
      ].join('\n')
    : '';
  const facturXKeys = facturX
    ? [
        `<fx:DocumentType>INVOICE</fx:DocumentType>`,
        `<fx:DocumentFileName>${escapeXml(facturX.filename ?? 'factur-x.xml')}</fx:DocumentFileName>`,
        `<fx:Version>${escapeXml(facturX.version ?? '1.0')}</fx:Version>`,
        `<fx:ConformanceLevel>${escapeXml(facturX.level)}</fx:ConformanceLevel>`,
      ].join('\n')
    : '';

  const upgraded = original
    .replace(
      ' xmlns:pdf="http://ns.adobe.com/pdf/1.3/">',
      [
        ' xmlns:pdf="http://ns.adobe.com/pdf/1.3/"',
        ' xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"',
        facturXLines,
        '>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .replace(
      '</rdf:Description>',
      `<pdfaid:part>${part}</pdfaid:part>\n<pdfaid:conformance>${conformance}</pdfaid:conformance>\n${facturXKeys}\n</rdf:Description>`,
    );

  // pdf-lib doesn't expose a stream setter so we re-register a fresh stream
  // and repoint the catalog reference. The old stream becomes dead weight in
  // the cross-ref but isn't reachable from the catalog any more.
  const replacement = doc.context.stream(upgraded, { Type: 'Metadata', Subtype: 'XML' });
  doc.catalog.set(PDFName.of('Metadata'), doc.context.register(replacement));
}

/**
 * PDF/A-3 attaches a primary data file via the catalog's `/AF` array and
 * marks the file with `/AFRelationship /Alternative`. The factur-X spec
 * additionally pins the file name to `factur-x.xml`.
 */
function embedFacturXAttachment(doc: PDFDocument, facturX: FacturXAttachment): void {
  const ctx = doc.context;
  const filename = facturX.filename ?? 'factur-x.xml';

  const fileStream = ctx.flateStream(facturX.xml, {
    Type: 'EmbeddedFile',
    Subtype: 'text/xml',
    Params: { ModDate: PDFString.fromDate(new Date()) },
  });
  const fileStreamRef = ctx.register(fileStream);

  const filespec = PDFDict.withContext(ctx);
  filespec.set(PDFName.of('Type'), PDFName.of('Filespec'));
  filespec.set(PDFName.of('F'), PDFString.of(filename));
  filespec.set(PDFName.of('UF'), PDFHexString.fromText(filename));
  filespec.set(PDFName.of('Desc'), PDFString.of('Factur-X invoice data'));
  filespec.set(PDFName.of('AFRelationship'), PDFName.of('Alternative'));

  const ef = PDFDict.withContext(ctx);
  ef.set(PDFName.of('F'), fileStreamRef);
  ef.set(PDFName.of('UF'), fileStreamRef);
  filespec.set(PDFName.of('EF'), ef);

  const filespecRef = ctx.register(filespec);

  const afArray =
    (doc.catalog.lookup(PDFName.of('AF')) as PDFArray | undefined) ?? PDFArray.withContext(ctx);
  afArray.push(filespecRef);
  doc.catalog.set(PDFName.of('AF'), afArray);

  const namesDict = ((): PDFDict => {
    const existing = doc.catalog.lookup(PDFName.of('Names'));
    if (existing instanceof PDFDict) return existing;
    const fresh = PDFDict.withContext(ctx);
    doc.catalog.set(PDFName.of('Names'), fresh);
    return fresh;
  })();
  const efTree = PDFDict.withContext(ctx);
  const namesArr = PDFArray.withContext(ctx);
  namesArr.push(PDFString.of(filename));
  namesArr.push(filespecRef);
  efTree.set(PDFName.of('Names'), namesArr);
  namesDict.set(PDFName.of('EmbeddedFiles'), efTree);
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]!);
}

function infoDictToXmpInput(doc: PDFDocument): Parameters<typeof buildXmpPacket>[0] {
  const info = doc.context.trailerInfo.Info;
  if (!info || !('lookup' in info)) return {};
  const dict = info as unknown as {
    lookup: (k: PDFName) => unknown;
  };
  const stringOrUndefined = (k: PDFName): string | undefined => {
    const v = dict.lookup(k);
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && 'asString' in v) {
      return (v as { asString: () => string }).asString();
    }
    if (v && typeof v === 'object' && 'decodeText' in v) {
      return (v as { decodeText: () => string }).decodeText();
    }
    return undefined;
  };
  const out: Parameters<typeof buildXmpPacket>[0] = {};
  const title = stringOrUndefined(PDFName.of('Title'));
  if (title) out.title = title;
  const author = stringOrUndefined(PDFName.of('Author'));
  if (author) out.author = author;
  const subject = stringOrUndefined(PDFName.of('Subject'));
  if (subject) out.subject = subject;
  return out;
}
