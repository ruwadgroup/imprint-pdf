/**
 * Standard PDF structure types defined by ISO 32000-2 Table 340.
 *
 * imprint-pdf.s reconciler emits HTML elements; `HTML_TO_ROLE` maps them onto
 * the canonical structure roles a screen reader expects in a tagged PDF.
 */
export type StructureRole =
  | 'Document'
  | 'Part'
  | 'Sect'
  | 'Div'
  | 'P'
  | 'H'
  | 'H1'
  | 'H2'
  | 'H3'
  | 'H4'
  | 'H5'
  | 'H6'
  | 'L'
  | 'LI'
  | 'LBody'
  | 'Lbl'
  | 'Table'
  | 'TR'
  | 'TH'
  | 'TD'
  | 'THead'
  | 'TBody'
  | 'TFoot'
  | 'Figure'
  | 'Caption'
  | 'Form'
  | 'Link'
  | 'Annot'
  | 'Code'
  | 'BlockQuote'
  | 'Note'
  | 'Span';

export const HTML_TO_ROLE: Readonly<Record<string, StructureRole>> = {
  h1: 'H1',
  h2: 'H2',
  h3: 'H3',
  h4: 'H4',
  h5: 'H5',
  h6: 'H6',
  p: 'P',
  div: 'Div',
  section: 'Sect',
  article: 'Part',
  ul: 'L',
  ol: 'L',
  li: 'LI',
  dl: 'L',
  dt: 'Lbl',
  dd: 'LBody',
  table: 'Table',
  tr: 'TR',
  th: 'TH',
  td: 'TD',
  thead: 'THead',
  tbody: 'TBody',
  tfoot: 'TFoot',
  figure: 'Figure',
  figcaption: 'Caption',
  a: 'Link',
  blockquote: 'BlockQuote',
  code: 'Code',
  pre: 'Code',
  span: 'Span',
  strong: 'Span',
  em: 'Span',
  small: 'Span',
};
