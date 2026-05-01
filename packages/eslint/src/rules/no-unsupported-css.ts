import type { Rule } from 'eslint';
import { createDocumentScope } from '../utils.js';

const UNSUPPORTED_PREFIXES = [
  'hover:',
  'focus:',
  'active:',
  'disabled:',
  'checked:',
  'visited:',
  'focus-within:',
  'focus-visible:',
  'group-hover:',
  'peer-',
  'motion-',
  'animate-',
  'transition-',
  'duration-',
  'delay-',
  'ease-',
  'cursor-',
  'pointer-events-',
  'select-',
  'resize-',
  'appearance-',
  'scroll-',
  'snap-',
  'touch-',
];

const UNSUPPORTED_CLASSES = [
  'sticky',
  'fixed',
  'overflow-scroll',
  'overflow-auto',
  'blur',
  'brightness-',
  'contrast-',
  'grayscale',
  'invert',
  'saturate-',
  'sepia',
  'backdrop-',
];

function isUnsupportedClass(cls: string): boolean {
  return (
    UNSUPPORTED_PREFIXES.some((p) => cls.startsWith(p)) ||
    UNSUPPORTED_CLASSES.some((u) => cls === u || cls.startsWith(u))
  );
}

export const noUnsupportedCss: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow CSS classes that have no PDF equivalent in Imprint',
    },
    schema: [
      {
        type: 'object',
        properties: { warn: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
    messages: {
      unsupported: 'Class "{{cls}}" has no PDF equivalent and will be silently dropped by Imprint.',
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
            quasis: Array<{ value: { cooked: string | null } }>;
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
          if (isUnsupportedClass(cls)) {
            context.report({ node, messageId: 'unsupported', data: { cls } });
          }
        }
      },
    };
  },
};
