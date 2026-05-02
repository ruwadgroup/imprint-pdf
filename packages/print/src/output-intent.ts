import type { PDFDocument } from 'pdf-lib';
import { PDFArray, PDFDict, PDFHexString, PDFName, PDFString } from 'pdf-lib';

/** Conformance level — `S` is the dictionary key inside `/OutputIntent`. */
export type OutputIntentSubtype = 'GTS_PDFX' | 'GTS_PDFA1';

export interface OutputIntentOptions {
  /** Subtype identifier; `GTS_PDFX` for X-1a/X-3/X-4, `GTS_PDFA1` for any PDF/A. */
  subtype: OutputIntentSubtype;
  /**
   * Raw bytes of the destination ICC profile (e.g. FOGRA39, GRACoL, sRGB IEC61966-2.1).
   * Required for PDF/X-4 and any PDF/A; PDF/X-4p documents that reference an
   * external profile by URL may pass `undefined` and supply only `info`.
   */
  iccProfile?: Uint8Array;
  /** Number of channels in the embedded profile. CMYK = 4, RGB = 3, Gray = 1. */
  iccComponents?: 1 | 3 | 4;
  /** Human-readable condition name, e.g. `"FOGRA39"`. */
  condition?: string;
  /** Standardised condition identifier registered with ICC, e.g. `"FOGRA39"`. */
  conditionIdentifier?: string;
  /** Registry URL, typically `"http://www.color.org"`. */
  registry?: string;
  /** Free-form info, e.g. `"Coated FOGRA39 (ISO 12647-2:2004)"`. */
  info?: string;
  /** PDF/X-4p only: external ICC profile reference by file name / URI. */
  externalProfileUri?: string;
}

/** Adds (or merges into) the document's `/OutputIntents` array — required by every PDF/X and PDF/A conformance level. */
export function addOutputIntent(doc: PDFDocument, options: OutputIntentOptions): void {
  const ctx = doc.context;
  const intent = PDFDict.withContext(ctx);
  intent.set(PDFName.of('Type'), PDFName.of('OutputIntent'));
  intent.set(PDFName.of('S'), PDFName.of(options.subtype));

  if (options.condition) {
    intent.set(PDFName.of('OutputCondition'), PDFString.of(options.condition));
  }
  if (options.conditionIdentifier) {
    intent.set(PDFName.of('OutputConditionIdentifier'), PDFString.of(options.conditionIdentifier));
  }
  if (options.registry) {
    intent.set(PDFName.of('RegistryName'), PDFString.of(options.registry));
  }
  if (options.info) {
    intent.set(PDFName.of('Info'), PDFString.of(options.info));
  }

  if (options.iccProfile) {
    const components = options.iccComponents ?? guessComponents(options.iccProfile);
    const stream = ctx.flateStream(options.iccProfile, { N: components });
    const ref = ctx.register(stream);
    intent.set(PDFName.of('DestOutputProfile'), ref);
  } else if (options.externalProfileUri) {
    const ref = PDFDict.withContext(ctx);
    ref.set(PDFName.of('Type'), PDFName.of('Filespec'));
    ref.set(PDFName.of('F'), PDFString.of(options.externalProfileUri));
    ref.set(PDFName.of('UF'), PDFHexString.fromText(options.externalProfileUri));
    intent.set(PDFName.of('DestOutputProfileRef'), ctx.register(ref));
  }

  const intentRef = ctx.register(intent);

  const existing = doc.catalog.lookup(PDFName.of('OutputIntents'));
  if (existing instanceof PDFArray) {
    existing.push(intentRef);
  } else {
    const arr = PDFArray.withContext(ctx);
    arr.push(intentRef);
    doc.catalog.set(PDFName.of('OutputIntents'), arr);
  }
}

/**
 * Best-effort component-count detection from the ICC header. The number of
 * input channels is encoded in bytes 16–19 as a four-character signature
 * (`GRAY`, `RGB `, `CMYK`, `Lab `, …).
 */
function guessComponents(profile: Uint8Array): 1 | 3 | 4 {
  if (profile.length < 20) return 4;
  const sig = String.fromCharCode(profile[16]!, profile[17]!, profile[18]!, profile[19]!);
  switch (sig) {
    case 'GRAY':
      return 1;
    case 'RGB ':
      return 3;
    case 'Lab ':
      return 3;
    case 'CMYK':
      return 4;
    default:
      return 4;
  }
}
