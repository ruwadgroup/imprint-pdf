import type { Rule } from 'eslint';
import { createDocumentScope } from '../utils.js';

const VIEWPORT_CLASSES = [
  'h-screen',
  'w-screen',
  'min-h-screen',
  'min-w-screen',
  'max-h-screen',
  'max-w-screen',
  'h-dvh',
  'h-svh',
  'h-lvh',
  'min-h-dvh',
  'min-h-svh',
  'min-h-lvh',
  'w-dvw',
  'w-svw',
  'w-lvw',
];

const VIEWPORT_PATTERN = /\[(?:\d*\.?\d+)(?:vh|vw|dvh|dvw|svh|svw|lvh|lvw)\]/;

const CONTAINER_QUERY_VARIANTS = ['@container', '@xs:', '@sm:', '@md:', '@lg:', '@xl:'];

const RUNTIME_VARIANTS = [
  'dark:',
  'motion-safe:',
  'motion-reduce:',
  'forced-colors:',
  'contrast-more:',
  'contrast-less:',
];

interface Categorized {
  category: 'viewport' | 'container' | 'runtime';
  cls: string;
}

function categorize(cls: string): Categorized | null {
  if (VIEWPORT_CLASSES.includes(cls)) return { category: 'viewport', cls };
  if (VIEWPORT_PATTERN.test(cls)) return { category: 'viewport', cls };
  if (CONTAINER_QUERY_VARIANTS.some((v) => cls.startsWith(v))) {
    return { category: 'container', cls };
  }
  if (RUNTIME_VARIANTS.some((v) => cls.startsWith(v))) return { category: 'runtime', cls };
  return null;
}

export const noPagedIncompatible: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Tailwind classes that resolve to CSS the paged formatter cannot honor (viewport units, container queries, runtime variants).',
    },
    schema: [],
    messages: {
      viewport:
        'Class "{{cls}}" depends on a viewport, which does not exist in paged output. Use page-relative sizing (`h-full`, `min-h-full`, or explicit pt/mm) instead.',
      container:
        'Class "{{cls}}" is a container query, which the paged formatter does not evaluate. Use plain breakpoints or page-aware sizing.',
      runtime:
        'Variant in "{{cls}}" only activates at runtime in a browser; it has no effect in PDFs.',
    },
  },
  create(context) {
    const scope = createDocumentScope();
    return {
      JSXElement: scope.enter,
      'JSXElement:exit': scope.exit,
      JSXAttribute(node: {
        type: 'JSXAttribute';
        name: { type: string; name: string };
        value: {
          type: string;
          value?: unknown;
          expression?: {
            type: string;
            quasis?: Array<{ value: { cooked: string | null } }>;
          };
        } | null;
      }) {
        if (!scope.active()) return;
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') return;

        const value = node.value;
        let classes: string[] = [];

        if (value?.type === 'Literal' && typeof value.value === 'string') {
          classes = value.value.split(/\s+/);
        } else if (
          value?.type === 'JSXExpressionContainer' &&
          value.expression?.type === 'TemplateLiteral'
        ) {
          const quasis = (value.expression.quasis ?? []).map(
            (q: { value: { cooked: string | null } }) => q.value.cooked ?? '',
          );
          classes = quasis.join(' ').split(/\s+/);
        }

        for (const cls of classes) {
          if (!cls) continue;
          const hit = categorize(cls);
          if (hit) context.report({ node, messageId: hit.category, data: { cls: hit.cls } });
        }
      },
    };
  },
};
