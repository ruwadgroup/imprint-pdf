import type { PDFDocument } from 'pdf-lib';
import { PDFName } from 'pdf-lib';
import type { DocumentNode } from '../types.js';

export interface XmpInput {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  lang?: string;
  creatorTool?: string;
  producer?: string;
  createDate?: Date;
  modifyDate?: Date;
  documentId?: string;
  instanceId?: string;
}

const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPE[c]!);
}

// XMP requires ISO-8601 without milliseconds.
function isoDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// `crypto.randomUUID` isn't on older Workers / some Deno builds.
function uuidV4(): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: { getRandomValues?: (b: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function buildXmpPacket(input: XmpInput): string {
  const lang = input.lang ?? 'x-default';
  const creatorTool = input.creatorTool ?? 'imprint';
  const producer = input.producer ?? 'imprint';
  const createDate = isoDate(input.createDate ?? new Date());
  const modifyDate = isoDate(input.modifyDate ?? input.createDate ?? new Date());
  const documentId = input.documentId ?? uuidV4();
  const instanceId = input.instanceId ?? uuidV4();

  const dc: string[] = [];
  if (input.title) {
    dc.push(
      `<dc:title><rdf:Alt><rdf:li xml:lang="${esc(lang)}">${esc(input.title)}</rdf:li></rdf:Alt></dc:title>`,
    );
  }
  if (input.author) {
    dc.push(`<dc:creator><rdf:Seq><rdf:li>${esc(input.author)}</rdf:li></rdf:Seq></dc:creator>`);
  }
  if (input.subject) {
    dc.push(
      `<dc:description><rdf:Alt><rdf:li xml:lang="${esc(lang)}">${esc(input.subject)}</rdf:li></rdf:Alt></dc:description>`,
    );
  }
  if (input.keywords && input.keywords.length > 0) {
    const items = input.keywords.map((k) => `<rdf:li>${esc(k)}</rdf:li>`).join('');
    dc.push(`<dc:subject><rdf:Bag>${items}</rdf:Bag></dc:subject>`);
  }
  if (input.lang) {
    dc.push(`<dc:language><rdf:Bag><rdf:li>${esc(input.lang)}</rdf:li></rdf:Bag></dc:language>`);
  }

  // BOM + magic id + `end="w"?>` trailer per XMP Spec Part 1 §10.5. The 2 KB
  // pad lets external tools rewrite the packet without shifting xref offsets.
  return [
    '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>',
    '<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="imprint XMP">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description rdf:about=""',
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"',
    ' xmlns:xmp="http://ns.adobe.com/xap/1.0/"',
    ' xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"',
    ' xmlns:pdf="http://ns.adobe.com/pdf/1.3/">',
    ...dc,
    `<xmp:CreatorTool>${esc(creatorTool)}</xmp:CreatorTool>`,
    `<xmp:CreateDate>${createDate}</xmp:CreateDate>`,
    `<xmp:ModifyDate>${modifyDate}</xmp:ModifyDate>`,
    `<xmp:MetadataDate>${modifyDate}</xmp:MetadataDate>`,
    `<pdf:Producer>${esc(producer)}</pdf:Producer>`,
    ...(input.keywords && input.keywords.length > 0
      ? [`<pdf:Keywords>${esc(input.keywords.join(', '))}</pdf:Keywords>`]
      : []),
    `<xmpMM:DocumentID>uuid:${documentId}</xmpMM:DocumentID>`,
    `<xmpMM:InstanceID>uuid:${instanceId}</xmpMM:InstanceID>`,
    '</rdf:Description>',
    '</rdf:RDF>',
    '</x:xmpmeta>',
    `${' '.repeat(2048)}\n`,
    '<?xpacket end="w"?>',
  ].join('\n');
}

/**
 * Attaches an XMP `/Metadata` stream to the document catalog. Emitted raw
 * (no `/Filter`) per PDF/A-1 (ISO 19005-1 §6.7.3); the Info dict carries
 * the same data, so we silently skip on failure.
 */
export function addXmpMetadata(doc: PDFDocument, document: DocumentNode): void {
  const props = document.props;
  const hasAny =
    props.title || props.author || props.subject || (props.keywords?.length ?? 0) > 0 || props.lang;
  if (!hasAny) return;

  try {
    const packet = buildXmpPacket({
      ...(props.title !== undefined && { title: props.title }),
      ...(props.author !== undefined && { author: props.author }),
      ...(props.subject !== undefined && { subject: props.subject }),
      ...(props.keywords !== undefined && { keywords: props.keywords }),
      ...(props.lang !== undefined && { lang: props.lang }),
    });

    const stream = doc.context.stream(packet, { Type: 'Metadata', Subtype: 'XML' });
    doc.catalog.set(PDFName.of('Metadata'), doc.context.register(stream));
  } catch {}
}
