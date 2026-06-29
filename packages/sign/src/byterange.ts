import { latin1ToBytes, toHex } from './bytes.js';
import { buildSignedData, type SignDataOptions } from './pkcs7.js';

export interface SignWithByteRangeOptions extends SignDataOptions {
  /** Reason field stored on the `/Sig` dict (`/Reason`). */
  reason?: string;
  /** Geographic location of the signer (`/Location`). */
  location?: string;
  /** `/ContactInfo` field, e.g. an email address. */
  contactInfo?: string;
  /** Hex placeholder size in bytes; must accommodate the worst-case signature. */
  placeholderSize?: number;
}

const DEFAULT_PLACEHOLDER_SIZE = 16384;
const SIG_FIELD_NAME = 'ImprintDocSig';

/**
 * Appends a real ISO 32000-2 §12.8 detached signature to a PDF buffer using
 * the standard `/ByteRange` mechanism — Adobe Acrobat, mobile readers, and
 * EU eIDAS validators all accept this path; the simpler trailer-comment
 * format produced by `signBuffer` is for in-house verification only.
 *
 * The function:
 *
 *   1. Appends a single incremental update with an AcroForm `/Sig` field
 *      whose `/ByteRange` and `/Contents` are zero-filled placeholders.
 *   2. Saves the document, scans for the placeholder, and computes the
 *      actual byte range — `[0, sigStart, sigEnd, eofLen]`.
 *   3. Builds a CMS detached PKCS#7 signature over the bytes outside the
 *      `/Contents` region and writes the DER into the placeholder as hex.
 *
 * Returns the final, signed PDF bytes.
 */
export async function signWithByteRange(
  pdf: Uint8Array,
  options: SignWithByteRangeOptions,
): Promise<Uint8Array> {
  const placeholderSize = options.placeholderSize ?? DEFAULT_PLACEHOLDER_SIZE;
  const stage = embedPlaceholder(pdf, options, placeholderSize);

  const range = locateContents(stage.bytes);
  if (!range) {
    throw new Error('[imprint/sign] failed to locate /Contents placeholder after embed');
  }

  const fileSize = stage.bytes.length;
  const byteRange: [number, number, number, number] = [
    0,
    range.contentsStart,
    range.contentsEnd,
    fileSize - range.contentsEnd,
  ];

  const withRange = patchByteRange(
    stage.bytes,
    range.byteRangeStart,
    range.byteRangeEnd,
    byteRange,
  );
  const signedBytes = sliceSignedRegions(withRange, byteRange);
  const signature = await buildSignedData(signedBytes, options);
  return patchContents(withRange, range.contentsStart, range.contentsEnd, signature);
}

interface PlaceholderRange {
  byteRangeStart: number;
  byteRangeEnd: number;
  contentsStart: number;
  contentsEnd: number;
}

interface StageResult {
  bytes: Uint8Array;
}

/**
 * Builds an incremental update appended to the original PDF that introduces:
 *
 *  - object N+0 — the `/Sig` dict with placeholder ByteRange/Contents;
 *  - object N+1 — a `/Sig` annotation widget anchored to the first page;
 *  - object N+2 — an updated `/AcroForm` dict referencing the field;
 *  - an updated catalog pointing to the new AcroForm + permissions;
 *  - a new xref section + trailer with `/Prev` pointing to the prior xref.
 *
 * The implementation deliberately avoids pdf-lib because pdf-lib doesn't
 * model incremental updates and would re-serialise the whole file —
 * destroying any signed state. Working at the byte level here is the same
 * approach used by `node-signpdf` and Adobe's own Acrobat Sign.
 */
function embedPlaceholder(
  pdf: Uint8Array,
  options: SignWithByteRangeOptions,
  placeholderSize: number,
): StageResult {
  const text = bytesToLatin1(pdf);
  const startxrefIdx = text.lastIndexOf('startxref');
  if (startxrefIdx < 0) throw new Error('[imprint/sign] PDF has no startxref');

  const prevXrefMatch = text.slice(startxrefIdx).match(/startxref\s+(\d+)/);
  const prevXref = prevXrefMatch ? Number.parseInt(prevXrefMatch[1]!, 10) : 0;

  // pdf-lib emits a Cross-Reference Stream (XRef stream) rather than the
  // classic `trailer` keyword. Both encode the same /Root and /Size data,
  // so we scan from the end of the file backwards looking for either.
  const tailSlice = text.slice(Math.max(0, prevXref - 4));
  const rootMatch = tailSlice.match(/\/Root\s+(\d+)\s+(\d+)\s+R/);
  const sizeMatch = tailSlice.match(/\/Size\s+(\d+)/);
  if (!rootMatch || !sizeMatch) {
    throw new Error('[imprint/sign] PDF trailer is missing /Root or /Size');
  }
  const rootNum = Number.parseInt(rootMatch[1]!, 10);
  const rootGen = Number.parseInt(rootMatch[2]!, 10);
  const prevSize = Number.parseInt(sizeMatch[1]!, 10);

  const sigObjNum = prevSize;
  const widgetObjNum = prevSize + 1;
  const acroObjNum = prevSize + 2;
  const catalogObjNum = prevSize + 3;
  const newSize = prevSize + 4;

  const baseLen = pdf.length;
  let body = '\n';

  const sigOffset = baseLen + body.length;
  const placeholder = '0'.repeat(placeholderSize);
  // Zero-padded ByteRange — the four numeric values are rewritten in-place
  // once we know the real offsets after assembling the whole update.
  body += `${sigObjNum} 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached /ByteRange [0000000000 0000000000 0000000000 0000000000] /Contents <${placeholder}>${sigMetadata(options)} >>\nendobj\n`;

  const widgetOffset = baseLen + body.length;
  body += `${widgetObjNum} 0 obj\n<< /Type /Annot /Subtype /Widget /FT /Sig /T (${SIG_FIELD_NAME}) /Rect [0 0 0 0] /V ${sigObjNum} 0 R /F 132 >>\nendobj\n`;

  const acroOffset = baseLen + body.length;
  body += `${acroObjNum} 0 obj\n<< /Fields [${widgetObjNum} 0 R] /SigFlags 3 >>\nendobj\n`;

  const catalogOffset = baseLen + body.length;
  body += `${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${findPagesRef(text, rootNum, rootGen)} /AcroForm ${acroObjNum} 0 R /Perms << /DocMDP ${sigObjNum} 0 R >> >>\nendobj\n`;

  const xrefOffset = baseLen + body.length;
  // Cross-ref subsection: object 0 is unchanged, then sigObjNum..catalogObjNum.
  // The catalog object replaces the old /Root, so the trailer's /Root will
  // point at the new catalog.
  body += 'xref\n';
  body += `0 1\n0000000000 65535 f \n`;
  body += `${sigObjNum} 4\n`;
  body += `${pad10(sigOffset)} 00000 n \n`;
  body += `${pad10(widgetOffset)} 00000 n \n`;
  body += `${pad10(acroOffset)} 00000 n \n`;
  body += `${pad10(catalogOffset)} 00000 n \n`;
  body += `trailer\n<< /Size ${newSize} /Root ${catalogObjNum} 0 R /Prev ${prevXref} >>\n`;
  body += `startxref\n${xrefOffset}\n%%EOF\n`;

  const bodyBytes = latin1ToBytes(body);
  const out = new Uint8Array(baseLen + bodyBytes.length);
  out.set(pdf, 0);
  out.set(bodyBytes, baseLen);
  return { bytes: out };
}

function sigMetadata(options: SignWithByteRangeOptions): string {
  let extra = '';
  if (options.reason) extra += ` /Reason (${escapePdfString(options.reason)})`;
  if (options.location) extra += ` /Location (${escapePdfString(options.location)})`;
  if (options.contactInfo) {
    extra += ` /ContactInfo (${escapePdfString(options.contactInfo)})`;
  }
  extra += ` /M (D:${pdfDate(new Date())})`;
  return extra;
}

function findPagesRef(text: string, rootNum: number, rootGen: number): string {
  const re = new RegExp(
    `${rootNum}\\s+${rootGen}\\s+obj\\s*<<([^>]|>(?!>))*?\\/Pages\\s+(\\d+)\\s+(\\d+)\\s+R`,
    's',
  );
  const m = text.match(re);
  if (!m) return '0 0 R';
  return `${m[3]} ${m[4]} R`;
}

function locateContents(bytes: Uint8Array): PlaceholderRange | null {
  const text = bytesToLatin1(bytes);
  const byteRangeIdx = text.lastIndexOf('/ByteRange');
  if (byteRangeIdx < 0) return null;
  const brOpen = text.indexOf('[', byteRangeIdx);
  const brClose = text.indexOf(']', brOpen);
  if (brOpen < 0 || brClose < 0) return null;

  const contentsIdx = text.indexOf('/Contents', brClose);
  if (contentsIdx < 0) return null;
  const contentsOpen = text.indexOf('<', contentsIdx);
  const contentsClose = text.indexOf('>', contentsOpen);
  if (contentsOpen < 0 || contentsClose < 0) return null;

  return {
    byteRangeStart: brOpen,
    byteRangeEnd: brClose + 1,
    contentsStart: contentsOpen,
    contentsEnd: contentsClose + 1,
  };
}

function patchByteRange(
  bytes: Uint8Array,
  start: number,
  end: number,
  range: [number, number, number, number],
): Uint8Array {
  const replacement = `[${range[0]} ${range[1]} ${range[2]} ${range[3]}]`;
  const out = new Uint8Array(bytes.length);
  out.set(bytes.subarray(0, start), 0);
  const replBytes = latin1ToBytes(replacement);
  out.set(replBytes, start);
  // Pad with spaces so we don't shift any other byte offsets.
  for (let i = start + replBytes.length; i < end; i++) out[i] = 0x20;
  out.set(bytes.subarray(end), end);
  return out;
}

function patchContents(
  bytes: Uint8Array,
  contentsStart: number,
  contentsEnd: number,
  signature: Uint8Array,
): Uint8Array {
  const hex = toHex(signature);
  const inner = `${`<${hex}`.padEnd(contentsEnd - contentsStart - 1, '0')}>`;
  const replBytes = latin1ToBytes(inner);
  if (replBytes.length !== contentsEnd - contentsStart) {
    throw new Error(
      `[imprint/sign] signature (${signature.length} bytes / ${hex.length} hex) exceeds placeholder of ${contentsEnd - contentsStart} bytes — pass placeholderSize`,
    );
  }
  const out = new Uint8Array(bytes.length);
  out.set(bytes.subarray(0, contentsStart), 0);
  out.set(replBytes, contentsStart);
  out.set(bytes.subarray(contentsEnd), contentsEnd);
  return out;
}

function sliceSignedRegions(
  bytes: Uint8Array,
  range: [number, number, number, number],
): Uint8Array {
  const a = bytes.subarray(range[0], range[0] + range[1]);
  const b = bytes.subarray(range[2], range[2] + range[3]);
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function pad10(n: number): string {
  return String(n).padStart(10, '0');
}

function pdfDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z00'00`
  );
}

function escapePdfString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function bytesToLatin1(bytes: Uint8Array): string {
  let out = '';
  const chunk = 0x4000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return out;
}
