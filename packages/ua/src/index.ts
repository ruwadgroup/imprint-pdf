// @imprint/ua — PDF/UA-1 tagged PDF, accessibility, structure tree
// BSL-1.1 licensed — see LICENSE-BSL for terms

// ---------------------------------------------------------------------------
// Document props
// ---------------------------------------------------------------------------

export interface UADocumentProps {
  /** BCP-47 language tag (required by PDF/UA-1), e.g. "en", "fr-CA". */
  lang?: string;
  /**
   * When true, the document title (from the PDF's /Title metadata entry)
   * is shown in the viewer's title bar instead of the file name.
   * Required for PDF/UA-1 conformance.
   */
  displayDocTitle?: boolean;
}

// ---------------------------------------------------------------------------
// Structure role types
// ---------------------------------------------------------------------------

/**
 * Standard PDF structure types as defined in ISO 32000-2 Table 340.
 * These map to the logical role of a tagged content item within the
 * document's structure tree.
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
  | 'Note';

// ---------------------------------------------------------------------------
// HTML → PDF structure role mapping
// ---------------------------------------------------------------------------

/**
 * Map from lowercase HTML element names to the corresponding PDF structure
 * role.  Used by the reconciler's auto-tagging pass when an explicit `role`
 * prop is not provided.
 */
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
} as const;

// ---------------------------------------------------------------------------
// Node shape used by validators
// ---------------------------------------------------------------------------

interface PdfNodeLike {
  type: string;
  id?: string | number;
  props?: Record<string, unknown>;
  children?: PdfNodeLike[];
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Walk a node tree and collect errors for `<Image>` nodes missing alt text.
 *
 * @param nodes  Top-level nodes (e.g. pages or the document root's children).
 * @returns Array of error message strings.
 */
export function validateAltText(nodes: unknown[]): string[] {
  const errors: string[] = [];

  function walk(node: PdfNodeLike): void {
    if (node.type === 'image' || node.type === 'Image') {
      const alt = node.props?.alt;
      if (!alt) {
        const id = node.id != null ? String(node.id) : '<unknown>';
        errors.push(`Image node ${id} is missing required alt text for PDF/UA`);
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  for (const n of nodes) {
    walk(n as PdfNodeLike);
  }

  return errors;
}

/**
 * Validate that the root document node declares a BCP-47 language tag.
 *
 * @param documentNode  The root `Document`-type IR node.
 * @returns Array of error message strings (empty if valid).
 */
export function validateLanguage(documentNode: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const props = documentNode.props as Record<string, unknown> | undefined;
  if (!props?.lang) {
    errors.push('Document is missing the required "lang" prop for PDF/UA (e.g., lang="en")');
  }
  return errors;
}

/**
 * Run all PDF/UA-1 validation checks on a document node tree.
 *
 * @param documentNode  The root document IR node.
 * @returns An object with `valid` flag and `errors` array.
 */
export function validateUAConformance(documentNode: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [...validateLanguage(documentNode)];

  const props = documentNode.props as Record<string, unknown> | undefined;
  if (!props?.title) {
    errors.push('Document is missing the "title" prop required for PDF/UA /Title metadata entry');
  }

  const children = documentNode.children as PdfNodeLike[] | undefined;
  if (children) {
    errors.push(...validateAltText(children));
  }

  return { valid: errors.length === 0, errors };
}
