# @imprint/eslint-plugin

ESLint rules for [Imprint](https://github.com/tamimbinhakim/imprint) — catch
problems at write time before they reach the renderer.

```bash
pnpm add -D @imprint/eslint-plugin
```

## Setup

```js
// eslint.config.mjs
import imprint from '@imprint/eslint-plugin';

export default [imprint.configs.recommended];
```

Or enable individual rules:

```js
import imprint from '@imprint/eslint-plugin';

export default [
  {
    plugins: { imprint },
    rules: {
      'imprint/no-unsupported-css': 'warn',
      'imprint/no-missing-alt': 'error',
      'imprint/no-dynamic-class-without-safelist': 'warn',
    },
  },
];
```

## Rules

| Rule                                        | Recommended | Description                                                                     |
| ------------------------------------------- | :---------: | ------------------------------------------------------------------------------- |
| `imprint/no-unsupported-css`                |    warn     | Warns on CSS properties that have no PDF equivalent (`position: sticky`, etc.). |
| `imprint/no-missing-alt`                    |    error    | Requires `alt` on `<Image>` and HTML `<img>` inside Imprint documents.          |
| `imprint/no-dynamic-class-without-safelist` |    warn     | Dynamic class names (`className={x}`) outside a statically-analysable safelist. |
| `imprint/no-hover-variants`                 |    warn     | `hover:`, `focus:`, `active:` variants have no effect in PDFs.                  |
| `imprint/require-page-in-document`          |    error    | `<Document>` must contain at least one `<Page>`.                                |
| `imprint/no-xfa-forms`                      |    error    | XFA is deprecated and unsupported; use `<Form>` with AcroForm components.       |
