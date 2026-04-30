import type { Rule } from 'eslint';
import { noDynamicClassWithoutSafelist } from './rules/no-dynamic-class-without-safelist.js';
import { noHoverVariants } from './rules/no-hover-variants.js';
import { noMissingAlt } from './rules/no-missing-alt.js';
import { noUnsupportedCss } from './rules/no-unsupported-css.js';
import { requirePageInDocument } from './rules/require-page-in-document.js';

const rules: Record<string, Rule.RuleModule> = {
  'no-unsupported-css': noUnsupportedCss,
  'no-missing-alt': noMissingAlt,
  'no-dynamic-class-without-safelist': noDynamicClassWithoutSafelist,
  'no-hover-variants': noHoverVariants,
  'require-page-in-document': requirePageInDocument,
};

const configs = {
  recommended: {
    plugins: ['imprint'],
    rules: {
      'imprint/no-unsupported-css': 'warn',
      'imprint/no-missing-alt': 'error',
      'imprint/no-dynamic-class-without-safelist': 'warn',
      'imprint/no-hover-variants': 'warn',
      'imprint/require-page-in-document': 'error',
    } as const,
  },
  /** Flat config (ESLint v9+) version of the recommended config */
  'flat/recommended': {
    plugins: {
      imprint: {
        rules,
      },
    },
    rules: {
      'imprint/no-unsupported-css': 'warn',
      'imprint/no-missing-alt': 'error',
      'imprint/no-dynamic-class-without-safelist': 'warn',
      'imprint/no-hover-variants': 'warn',
      'imprint/require-page-in-document': 'error',
    } as const,
  },
};

const plugin = { rules, configs };

export default plugin;
export { configs, rules };
