import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import { noDynamicClassWithoutSafelist } from '../no-dynamic-class-without-safelist.js';
import { noHoverVariants } from '../no-hover-variants.js';
import { noMissingAlt } from '../no-missing-alt.js';
import { noUnsupportedCss } from '../no-unsupported-css.js';
import { requirePageInDocument } from '../require-page-in-document.js';

// Wire RuleTester to Vitest's runner so cases appear as real test entries
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2022,
    },
  },
});

// Wrap code inside <Document> to activate scope guards
const inDoc = (inner: string) => `const x = (<Document>${inner}</Document>);`;
// Code outside any <Document> — rules must stay silent
const outside = (inner: string) => `const x = (${inner});`;

tester.run('no-hover-variants', noHoverVariants, {
  valid: [
    { code: outside('<div className="hover:text-red-500" />') },
    { code: inDoc('<View className="text-red-500 flex p-4" />') },
  ],
  invalid: [
    {
      code: inDoc('<View className="hover:text-red-500" />'),
      errors: [{ messageId: 'noHover' }],
    },
    {
      code: inDoc('<View className="flex focus:outline-none" />'),
      errors: [{ messageId: 'noHover' }],
    },
  ],
});

tester.run('no-unsupported-css', noUnsupportedCss, {
  valid: [
    { code: outside('<div className="hover:text-red-500 sticky" />') },
    { code: inDoc('<View className="flex p-4 text-red-500" />') },
  ],
  invalid: [
    {
      code: inDoc('<View className="hover:text-blue-500" />'),
      errors: [{ messageId: 'unsupported' }],
    },
    {
      code: inDoc('<View className="sticky" />'),
      errors: [{ messageId: 'unsupported' }],
    },
  ],
});

tester.run('no-dynamic-class-without-safelist', noDynamicClassWithoutSafelist, {
  valid: [
    { code: outside('<div className={`text-${size}`} />') },
    { code: inDoc('<View className="flex p-4" />') },
    { code: inDoc('<View className={"flex p-4"} />') },
  ],
  invalid: [
    {
      code: inDoc('<View className={`text-${size}`} />'),
      errors: [{ messageId: 'dynamic' }],
    },
    {
      code: inDoc('<View className={isActive ? "flex" : "hidden"} />'),
      errors: [{ messageId: 'dynamic' }],
    },
    {
      code: inDoc('<View className={isActive && "flex"} />'),
      errors: [{ messageId: 'dynamic' }],
    },
  ],
});

tester.run('no-missing-alt', noMissingAlt, {
  valid: [
    { code: outside('<Image src="logo.png" />') },
    { code: inDoc('<Image src="logo.png" alt="Company logo" />') },
    { code: inDoc('<View><Image src="photo.jpg" alt="" /></View>') },
  ],
  invalid: [
    {
      code: inDoc('<Image src="logo.png" />'),
      errors: [{ messageId: 'missingAlt' }],
    },
    {
      code: inDoc('<Page><View><Image src="photo.jpg" /></View></Page>'),
      errors: [{ messageId: 'missingAlt' }],
    },
  ],
});

tester.run('require-page-in-document', requirePageInDocument, {
  valid: [
    { code: 'const x = (<Document><Page><View /></Page></Document>);' },
    { code: 'const x = (<Document><Page /><Page /></Document>);' },
  ],
  invalid: [
    {
      code: 'const x = (<Document><View /></Document>);',
      errors: [{ messageId: 'noPage' }],
    },
    {
      code: 'const x = (<Document></Document>);',
      errors: [{ messageId: 'noPage' }],
    },
  ],
});
