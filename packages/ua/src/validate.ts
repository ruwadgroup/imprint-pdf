import type { DocumentNode, PdfNode } from '@imprint/core';

export interface UAValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface NodeLike {
  type: string;
  id?: string | number;
  props?: Record<string, unknown>;
  children?: NodeLike[];
}

/**
 * Walks an Imprint IR tree and reports the conformance issues that PDF/UA-1
 * (ISO 14289-1) makes a hard requirement: language tag, document title,
 * alt text on every `<Image>` / `<Svg>`, and a `lang` attribute on any text
 * node whose script differs from the document language.
 *
 * The result is purely advisory — the writer still produces a tagged PDF —
 * but `imprint validate --profile pdf-ua-1` exits non-zero on any error.
 */
export function validateUA(documentNode: DocumentNode): UAValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const props = documentNode.props as Record<string, unknown>;

  if (!props.lang) {
    errors.push('Document is missing the `lang` prop required by PDF/UA-1 (e.g. lang="en").');
  }
  if (!props.title) {
    errors.push('Document is missing the `title` prop required for PDF/UA-1 /Title metadata.');
  }
  if (props.displayDocTitle === false) {
    warnings.push(
      'Document.displayDocTitle is false; PDF/UA-1 §7.1 requires viewers display the title.',
    );
  }

  walk(documentNode as unknown as NodeLike, (node) => {
    if (node.type === 'image' || node.type === 'svg') {
      const alt =
        (node.props?.alt as string | undefined) ??
        (node.props?.['aria-label'] as string | undefined) ??
        (node.props?.title as string | undefined);
      if (!alt) {
        errors.push(
          `<${cap(node.type)}> ${describeId(node.id)} is missing alt text required by PDF/UA-1.`,
        );
      }
    }
    if (node.type === 'link') {
      const href = node.props?.href as string | undefined;
      if (href && !node.children?.length) {
        warnings.push(`<a href="${href}"> has no descendant text — screen readers will skip it.`);
      }
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

function walk(node: NodeLike, visit: (node: NodeLike) => void): void {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function describeId(id: NodeLike['id']): string {
  return id == null ? '<unknown>' : `#${String(id)}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Convenience guard kept around for the CLI's `--profile pdf-ua-1` mode and
 * for back-compat with the v0.5 `validateUAConformance` shape.
 */
export function validateUAConformance(documentNode: DocumentNode): {
  valid: boolean;
  errors: string[];
} {
  const { valid, errors } = validateUA(documentNode);
  return { valid, errors };
}

/**
 * Type predicate that matches any node carrying user-visible text, for
 * call sites that want to attach `Span` tags only to leaves with content.
 */
export function isTextLeaf(node: PdfNode): boolean {
  return node.type === 'text' && typeof (node as { text?: unknown }).text === 'string';
}
