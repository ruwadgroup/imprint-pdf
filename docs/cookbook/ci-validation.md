# Cookbook — CI validation (PDF/UA, PDF/X)

Run veraPDF in CI to certify that every generated PDF passes PDF/UA-1 or PDF/X-4
conformance. Requires `@imprint-pdf/print` or `@imprint-pdf/ua`.

## Setup

```bash
pnpm add -D @imprint-pdf/cli
```

`@imprint-pdf/cli` ships a Node wrapper around veraPDF. Java 11+ must be
installed on the CI runner.

## Validate a single file

```bash
imprint validate ./dist/report.pdf --profile pdf-ua-1
# exits 0 on pass, 1 on fail — safe for CI gates
```

Supported profiles: `pdf-ua-1`, `pdf-ua-2` (roadmap), `pdf-x-4`, `pdf-a-2b`,
`pdf-a-3`.

## GitHub Actions

```yaml
# .github/workflows/pdf-validate.yml
name: PDF Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: temurin

      - uses: pnpm/action-setup@v4
        with: { version: 10 }

      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - run: pnpm install --frozen-lockfile

      - name: Render test PDFs
        run: |
          pnpm tsx scripts/render-test-pdfs.ts

      - name: Validate PDF/UA-1
        run: |
          imprint validate ./dist/test-invoice.pdf --profile pdf-ua-1
          imprint validate ./dist/test-report.pdf --profile pdf-ua-1
```

## Rendering test PDFs in CI

```ts
// scripts/render-test-pdfs.ts
import { renderToBuffer } from '@imprint-pdf/react';
import '@imprint-pdf/ua';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Invoice } from '../src/templates/Invoice';
import { Report } from '../src/templates/Report';

mkdirSync('./dist', { recursive: true });

writeFileSync(
  './dist/test-invoice.pdf',
  await renderToBuffer(<Invoice data={testInvoice} />)
);

writeFileSync(
  './dist/test-report.pdf',
  await renderToBuffer(<Report data={testReport} />)
);
```

## veraPDF exit codes

| Code | Meaning                                |
| ---- | -------------------------------------- |
| 0    | All files passed.                      |
| 1    | One or more files failed conformance.  |
| 2    | veraPDF encountered an internal error. |

## What veraPDF checks

For **PDF/UA-1** (ISO 14289-1):

- Marked content (`Marked` entry in `MarkInfo`).
- Structure tree presence and correctness.
- Alt text on figures.
- Logical reading order.
- Document language set.
- Tagged PDF annotations.

For **PDF/X-4** (ISO 15930-7):

- Output intent with ICC profile.
- No LZW compression.
- No transparency without intent.
- Embedded fonts only (no `FontDescriptor` URIs).
- Correct bleed box / trim box relationship.
