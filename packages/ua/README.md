# @imprint/ua

Tagged PDF and PDF/UA-1 accessible output for
[Imprint](https://github.com/tamimbinhakim/imprint).

Mandated by the EU European Accessibility Act (EAA, in force June 2025) and
US Section 508. This package makes Imprint's output machine-verifiable against
PDF/UA-1 (ISO 14289-1) and PDF/UA-2 (roadmap).

**License: Business Source License 1.1.** Reverts to Apache-2.0 after four
years. See [`LICENSING.md`](../../LICENSING.md).

```bash
pnpm add @imprint/ua
```

## What it adds

- **PDF structure tree.** Semantic tags (`H1`–`H6`, `P`, `Table`, `List`,
  `Figure`, etc.) emitted from the layout IR into the PDF object tree.
- **Marked-content sequences.** `mcid` references link each content stream
  operator back to a structure element.
- **Alt text.** Reads JSX `alt`, `aria-label`, and `title` props.
- **Language.** `<Document lang="en-US">` sets the document language; per-span
  `lang` overrides work on `<Text>` and HTML `<span>`.
- **`MarkInfo` dictionary.** `Marked: true` required by PDF/UA-1.
- **veraPDF CI.** `imprint validate --profile pdf-ua-1` (via `@imprint/cli`)
  runs veraPDF and exits non-zero on failure.

## Usage

```tsx
import '@imprint/ua'; // registers the tagged-PDF writer

const pdf = await renderToBuffer(
  <Document lang="en-US">
    <Page size="A4" className="p-12">
      <h1 className="text-3xl font-bold">Accessible PDF</h1>
      <img src={logoUrl} alt="Acme Corp logo" className="mt-4 h-16" />
      <table aria-label="Q1 Revenue">
        <thead>
          <tr><th>Region</th><th>Revenue</th></tr>
        </thead>
        <tbody>
          <tr><td>North America</td><td>$4.2M</td></tr>
        </tbody>
      </table>
    </Page>
  </Document>
);
```

## Validation in CI

```bash
imprint validate ./dist/report.pdf --profile pdf-ua-1
# → veraPDF reports pass/fail; exits non-zero on any failure
```
