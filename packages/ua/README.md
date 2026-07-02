# @imprint-pdf/ua

Tagged PDF and PDF/UA-1 accessible output for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf).

Mandated by the EU European Accessibility Act (EAA, in force June 2025) and US
Section 508. This package makes imprint-pdf's output machine-verifiable against
PDF/UA-1 (ISO 14289-1).

**License: Apache-2.0.** See [`LICENSE`](../../LICENSE).

```bash
pnpm add @imprint-pdf/ua
```

## What it adds

- **PDF structure tree.** `StructElem` dictionaries (`H1`–`H6`, `P`, `Table`,
  `Figure`, `Link`, etc.) built from the reconciler IR.
- **`MarkInfo` + `ViewerPreferences`.** `Marked: true` and
  `DisplayDocTitle: true` required by PDF/UA-1 §7.1.
- **Alt text.** Reads JSX `alt`, `aria-label`, and `title` props from image and
  SVG nodes.
- **Language.** `<Document lang="en-US">` sets `/Lang` on the catalog.
- **Pre-render IR validation.** `validateUA` reports missing `lang`, missing
  `title`, and images without alt text before a byte of PDF is written.

## Usage

### Wire up the `postProcess` hook

```ts
import { pdf } from '@imprint-pdf/react';
import { taggedPdf } from '@imprint-pdf/ua';

const response = await pdf(
  <Document lang="en-US" title="Q1 Report">
    <Page size="A4" className="p-12">
      <h1 className="text-3xl font-bold">Accessible PDF</h1>
      <img src={logoUrl} alt="Acme Corp logo" className="mt-4 h-16" />
    </Page>
  </Document>,
  { postProcess: [taggedPdf()] },
);
```

### Validate the IR before rendering

```ts
import { validateUA } from '@imprint-pdf/ua';

const result = validateUA(documentNode);
if (!result.valid) {
  console.error(result.errors); // missing lang, missing alt, etc.
}
```

## Validation in CI

```bash
imprint validate ./dist/report.pdf --profile pdf-ua-1
# → veraPDF reports pass/fail; exits non-zero on any failure
```

## Low-level helpers

| Export                  | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `taggedPdf()`           | `postProcess` hook — writes structure tree + catalog    |
| `applyStructTree`       | Applies the structure tree to an existing `PDFDocument` |
| `validateUA`            | Walks an IR tree and returns errors + warnings          |
| `validateUAConformance` | Subset alias kept for CLI `--profile pdf-ua-1` compat   |
| `isTextLeaf`            | Type predicate — node carries user-visible text         |
| `HTML_TO_ROLE`          | Map from HTML tag names to PDF structure roles          |
