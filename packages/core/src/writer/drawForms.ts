import type { PDFDocument, PDFPage } from 'pdf-lib';
import { PDFArray, PDFDict, PDFName, PDFString } from 'pdf-lib';
import type {
  ButtonNode,
  CheckboxNode,
  ComputedGeometry,
  DropdownNode,
  RadioGroupNode,
  ResolvedStyle,
  SignatureNode,
  TextFieldNode,
} from '../types.js';
import { parseColor, toPt } from './color.js';
import { pdfY } from './coords.js';

// PDF spec §12.7.3.1, table 227 (Tx) / §12.7.4.2.1, table 229 (Btn) /
// §12.7.4.4.1, table 231 (Ch). Bit positions are 1-indexed in the spec.
const FF_REQUIRED = 1 << 1; // bit 2: Required
const FF_MULTILINE = 1 << 12; // bit 13: Multiline (Tx)
const FF_RADIO = 1 << 15; // bit 16: Radio (Btn)
const FF_PUSHBUTTON = 1 << 16; // bit 17: Pushbutton (Btn)
const FF_COMBO = 1 << 17; // bit 18: Combo (Ch)

/**
 * Default-appearance string for a form widget (PDF spec §12.7.3.3). The format
 * is a tiny PDF content-stream snippet: font/size selector, then a colour op.
 *
 * We always emit Helvetica because embedding the user's font into the
 * widget's own resource dictionary is a separate, much bigger problem; viewers
 * fall back to Helvetica anyway when the named font isn't available.
 */
function buildDA(style: ResolvedStyle): string {
  const fontSize = toPt(style.fontSize, 12);
  const color = parseColor(style.color as string | undefined);
  let colorOp = '0 g';
  if (color && 'red' in color) {
    const fmt = (n: number) => Math.round(n * 1000) / 1000;
    colorOp = `${fmt(color.red)} ${fmt(color.green)} ${fmt(color.blue)} rg`;
  } else if (color && 'gray' in color) {
    colorOp = `${Math.round((color as { gray: number }).gray * 1000) / 1000} g`;
  }
  return `/Helvetica ${fontSize} Tf ${colorOp}`;
}

function ensureAcroForm(doc: PDFDocument): PDFDict {
  let acroForm = doc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
  if (!acroForm) {
    const fields = doc.context.obj([]) as PDFArray;
    acroForm = doc.context.obj({ Fields: fields }) as PDFDict;
    doc.catalog.set(PDFName.of('AcroForm'), doc.context.register(acroForm));
  }
  return acroForm;
}

function rectArray(doc: PDFDocument, x: number, y: number, w: number, h: number): PDFArray {
  const arr = PDFArray.withContext(doc.context);
  arr.push(doc.context.obj(x));
  arr.push(doc.context.obj(y));
  arr.push(doc.context.obj(x + w));
  arr.push(doc.context.obj(y + h));
  return arr;
}

function registerField(doc: PDFDocument, page: PDFPage, fieldDict: PDFDict): void {
  const fieldRef = doc.context.register(fieldDict);
  page.node.addAnnot(fieldRef);
  const acroForm = ensureAcroForm(doc);
  const fields = acroForm.lookup(PDFName.of('Fields'));
  if (fields instanceof PDFArray) fields.push(fieldRef);
}

export function drawTextField(
  node: TextFieldNode,
  page: PDFPage,
  doc: PDFDocument,
  pageHeight: number,
  geo: ComputedGeometry,
): void {
  const { x, y, width, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);
  const props = node.props;
  const flags = (props.required ? FF_REQUIRED : 0) | (props.multiline ? FF_MULTILINE : 0);

  const fieldDict = doc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    FT: PDFName.of('Tx'),
    Rect: rectArray(doc, x, pdfYPos, width, height),
    T: PDFString.of(props.name),
    DA: PDFString.of(buildDA(node.style)),
  }) as PDFDict;

  if (flags > 0) fieldDict.set(PDFName.of('Ff'), doc.context.obj(flags));
  if (props.defaultValue !== undefined)
    fieldDict.set(PDFName.of('V'), PDFString.of(props.defaultValue));
  if (props.maxLength !== undefined)
    fieldDict.set(PDFName.of('MaxLen'), doc.context.obj(props.maxLength));

  registerField(doc, page, fieldDict);
}

export function drawCheckbox(
  node: CheckboxNode,
  page: PDFPage,
  doc: PDFDocument,
  pageHeight: number,
  geo: ComputedGeometry,
): void {
  const { x, y, width, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);
  const props = node.props;
  const checked = props.defaultChecked ?? false;

  registerField(
    doc,
    page,
    doc.context.obj({
      Type: PDFName.of('Annot'),
      Subtype: PDFName.of('Widget'),
      FT: PDFName.of('Btn'),
      Rect: rectArray(doc, x, pdfYPos, width, height),
      T: PDFString.of(props.name),
      V: checked ? PDFName.of('Yes') : PDFName.of('Off'),
      AS: checked ? PDFName.of('Yes') : PDFName.of('Off'),
    }) as PDFDict,
  );
}

export function drawRadioGroup(
  node: RadioGroupNode,
  page: PDFPage,
  doc: PDFDocument,
  pageHeight: number,
  geo: ComputedGeometry,
): void {
  const { x, y, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);
  const props = node.props;
  const options = props.options ?? [];
  if (options.length === 0) return;

  // Radio groups are modeled as a single field with N child widgets (PDF spec
  // §12.7.4.2.3). The parent owns the value and the field flags; only the
  // children get on-page Rects and annotations.
  const groupDict = doc.context.obj({
    FT: PDFName.of('Btn'),
    Ff: doc.context.obj(FF_RADIO),
    T: PDFString.of(props.name),
    V: PDFName.of(props.defaultValue ?? 'Off'),
    Kids: doc.context.obj([]) as PDFArray,
  }) as PDFDict;
  const groupRef = doc.context.register(groupDict);

  const acroForm = ensureAcroForm(doc);
  const fields = acroForm.lookup(PDFName.of('Fields'));
  if (fields instanceof PDFArray) fields.push(groupRef);

  const optH = height / options.length;
  const radioSize = Math.min(optH * 0.7, 14);
  const kidsArr = groupDict.lookup(PDFName.of('Kids')) as PDFArray;

  for (let i = 0; i < options.length; i++) {
    const opt = options[i]!;
    // i=0 is the first (topmost) option in document order; PDF y goes up,
    // so the first option sits at the highest y-coordinate.
    const optCenterY = pdfYPos + height - (i + 0.5) * optH;
    const ry = optCenterY - radioSize / 2;

    const isChecked = props.defaultValue === opt.value;
    const widgetDict = doc.context.obj({
      Type: PDFName.of('Annot'),
      Subtype: PDFName.of('Widget'),
      Rect: rectArray(doc, x, ry, radioSize, radioSize),
      Parent: groupRef,
      AS: isChecked ? PDFName.of(opt.value) : PDFName.of('Off'),
    }) as PDFDict;

    const widgetRef = doc.context.register(widgetDict);
    kidsArr.push(widgetRef);
    page.node.addAnnot(widgetRef);
  }
}

export function drawDropdown(
  node: DropdownNode,
  page: PDFPage,
  doc: PDFDocument,
  pageHeight: number,
  geo: ComputedGeometry,
): void {
  const { x, y, width, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);
  const props = node.props;
  const options = props.options ?? [];

  // PDF Choice fields (§12.7.4.4): each option is [exportValue, displayValue].
  // Exporting separately from display lets form data stay stable when labels
  // get translated or rephrased.
  const optArr = doc.context.obj([]) as PDFArray;
  for (const opt of options) {
    const pair = PDFArray.withContext(doc.context);
    pair.push(PDFString.of(opt.value));
    pair.push(PDFString.of(opt.label));
    optArr.push(pair);
  }

  const fieldDict = doc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    FT: PDFName.of('Ch'),
    Ff: doc.context.obj(FF_COMBO),
    Rect: rectArray(doc, x, pdfYPos, width, height),
    T: PDFString.of(props.name),
    Opt: optArr,
    DA: PDFString.of(buildDA(node.style)),
  }) as PDFDict;

  if (props.defaultValue !== undefined) {
    fieldDict.set(PDFName.of('V'), PDFString.of(props.defaultValue));
    fieldDict.set(PDFName.of('I'), doc.context.obj([]));
  }

  registerField(doc, page, fieldDict);
}

export function drawButton(
  node: ButtonNode,
  page: PDFPage,
  doc: PDFDocument,
  pageHeight: number,
  geo: ComputedGeometry,
): void {
  const { x, y, width, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);
  const props = node.props;

  const fieldDict = doc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    FT: PDFName.of('Btn'),
    Ff: doc.context.obj(FF_PUSHBUTTON),
    Rect: rectArray(doc, x, pdfYPos, width, height),
    T: PDFString.of(props.name),
    DA: PDFString.of(buildDA(node.style)),
  }) as PDFDict;

  registerField(doc, page, fieldDict);
}

export function drawSignature(
  node: SignatureNode,
  page: PDFPage,
  doc: PDFDocument,
  pageHeight: number,
  geo: ComputedGeometry,
): void {
  const { x, y, width, height } = geo;
  const pdfYPos = pdfY(pageHeight, y, height);
  const props = node.props;

  const fieldDict = doc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    FT: PDFName.of('Sig'),
    Rect: rectArray(doc, x, pdfYPos, width, height),
    T: PDFString.of(props.name),
  }) as PDFDict;

  registerField(doc, page, fieldDict);
}
