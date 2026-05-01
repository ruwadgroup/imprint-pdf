import type { Rule } from 'eslint';
import { createDocumentScope } from '../utils.js';

export const noMissingAlt: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require alt text on <Image> components for PDF/UA accessibility',
    },
    schema: [],
    messages: {
      missingAlt: '<Image> is missing the required "alt" prop for PDF/UA accessibility.',
    },
  },
  create(context) {
    const scope = createDocumentScope();
    return {
      JSXElement: scope.enter,
      'JSXElement:exit': scope.exit,
      JSXOpeningElement(node: {
        type: 'JSXOpeningElement';
        name: { type: string; name: string };
        attributes: Array<{
          type: string;
          name?: { type: string; name: string };
        }>;
      }) {
        if (!scope.active()) return;
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'Image') return;

        const hasAlt = node.attributes.some(
          (a) =>
            a.type === 'JSXAttribute' && a.name?.type === 'JSXIdentifier' && a.name.name === 'alt',
        );

        if (!hasAlt) {
          context.report({ node, messageId: 'missingAlt' });
        }
      },
    };
  },
};
