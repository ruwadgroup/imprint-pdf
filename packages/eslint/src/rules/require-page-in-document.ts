import type { Rule } from 'eslint';

export const requirePageInDocument: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require at least one <Page> inside <Document>',
    },
    schema: [],
    messages: {
      noPage: '<Document> must contain at least one <Page> child.',
    },
  },
  create(context) {
    return {
      JSXElement(node: {
        type: 'JSXElement';
        openingElement: { name: { type: string; name: string } };
        children: Array<{
          type: string;
          openingElement: { name: { type: string; name: string } };
        }>;
      }) {
        const opening = node.openingElement;
        if (opening.name.type !== 'JSXIdentifier' || opening.name.name !== 'Document') return;

        const hasPage = node.children.some((child) => {
          if (child.type !== 'JSXElement') return false;
          const cn = child.openingElement.name;
          return cn.type === 'JSXIdentifier' && cn.name === 'Page';
        });

        if (!hasPage) {
          context.report({ node, messageId: 'noPage' });
        }
      },
    };
  },
};
