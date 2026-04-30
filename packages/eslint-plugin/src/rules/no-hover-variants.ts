import type { Rule } from 'eslint';
import { createDocumentScope } from '../utils.js';

const INTERACTIVE_VARIANTS = ['hover:', 'focus:', 'active:', 'disabled:', 'visited:', 'checked:'];

export const noHoverVariants: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hover:, focus:, and other interactive variants — they have no effect in PDFs',
    },
    schema: [],
    messages: {
      noHover: 'Interactive variant "{{variant}}" has no effect in PDFs.',
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
        value: { type: string; value?: unknown } | null;
      }) {
        if (!scope.active()) return;
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') return;

        const value = node.value;
        if (value?.type !== 'Literal' || typeof value.value !== 'string') return;

        const classes = value.value.split(/\s+/);
        for (const cls of classes) {
          if (!cls) continue;
          const variant = INTERACTIVE_VARIANTS.find((v) => cls.startsWith(v));
          if (variant) {
            context.report({
              node,
              messageId: 'noHover',
              data: { variant },
            });
          }
        }
      },
    };
  },
};
