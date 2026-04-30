import type { PDFDocument, PDFPage } from 'pdf-lib';
import { PDFArray, PDFDict, PDFName, PDFString } from 'pdf-lib';
import type { CheckboxNode, ComputedGeometry, TextFieldNode } from '../types.js';
import { pdfY } from './coords.js';

function ensureAcroForm(doc: PDFDocument): PDFDict {
  let acroForm = doc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
  if (!acroForm) {
    const fields = doc.context.obj([]) as PDFArray;
    acroForm = doc.context.obj({ Fields: fields }) as PDFDict;
    doc.catalog.set(PDFName.of('AcroForm'), doc.context.register(acroForm));
  }
  return acroForm;
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
  const flags = props.required ? (props.multiline ? 4096 | 2 : 2) : props.multiline ? 4096 : 0;

  const rectArr = PDFArray.withContext(doc.context);
  rectArr.push(doc.context.obj(x));
  rectArr.push(doc.context.obj(pdfYPos));
  rectArr.push(doc.context.obj(x + width));
  rectArr.push(doc.context.obj(pdfYPos + height));

  const fieldDict = doc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    FT: PDFName.of('Tx'),
    Rect: rectArr,
    T: PDFString.of(props.name),
    DA: PDFString.of('/Helvetica 12 Tf 0 g'),
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

  const rectArr = PDFArray.withContext(doc.context);
  rectArr.push(doc.context.obj(x));
  rectArr.push(doc.context.obj(pdfYPos));
  rectArr.push(doc.context.obj(x + width));
  rectArr.push(doc.context.obj(pdfYPos + height));

  registerField(
    doc,
    page,
    doc.context.obj({
      Type: PDFName.of('Annot'),
      Subtype: PDFName.of('Widget'),
      FT: PDFName.of('Btn'),
      Rect: rectArr,
      T: PDFString.of(props.name),
      V: checked ? PDFName.of('Yes') : PDFName.of('Off'),
      AS: checked ? PDFName.of('Yes') : PDFName.of('Off'),
    }) as PDFDict,
  );
}
