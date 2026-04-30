import type { Rule } from 'eslint';
import { createDocumentScope } from '../utils.js';

export const noDynamicClassWithoutSafelist: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn on dynamic className expressions that may not be extracted by the Tailwind plugin',
    },
    schema: [],
    messages: {
      dynamic:
        'Dynamic className expression may not be extracted by the Imprint Tailwind plugin. Add classes to the safelist in imprint.config.ts.',
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
          expression?: { type: string; expressions?: unknown[] };
        } | null;
      }) {
        if (!scope.active()) return;
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') return;

        const value = node.value;
        if (value?.type !== 'JSXExpressionContainer') return;

        const expr = value.expression;
        if (!expr) return;

        // Template literals with interpolated expressions (e.g., `text-${size}`)
        if (expr.type === 'TemplateLiteral' && (expr.expressions?.length ?? 0) > 0) {
          context.report({ node, messageId: 'dynamic' });
          return;
        }

        // Ternary: condition ? 'class-a' : 'class-b'
        if (expr.type === 'ConditionalExpression') {
          context.report({ node, messageId: 'dynamic' });
          return;
        }

        // Logical: condition && 'class-a'
        if (expr.type === 'LogicalExpression') {
          context.report({ node, messageId: 'dynamic' });
          return;
        }
      },
    };
  },
};
