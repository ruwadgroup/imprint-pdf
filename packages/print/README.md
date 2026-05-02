# @imprint-pdf/print

Print-ready output (PDF/X-4, CMYK, ICC profiles, bleed/trim, PDF/A) for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Optional add-on
package — Apache-2.0 like the rest of the project.

**License: Apache-2.0.** See [`LICENSING.md`](../../LICENSING.md).

```bash
pnpm add @imprint-pdf/print
```

## What it adds

- **PDF/X-4 and PDF/X-4p** output intent with embedded ICC profiles (FOGRA39 /
  PSO Coated v3 by default; bring your own ICC bytes).
- **CMYK colour.** Direct CMYK values via `imprint:cmyk-[c,m,y,k]` Tailwind
  class or the `rgbToCmyk` / `cmykOperator` helpers.
- **Spot colours.** `defineSpotColor` + `embedSpotColorSpace` with CMYK
  fallback; overprint via `embedOverprintState`.
- **Bleed, trim, crop, and registration marks.** `applyPageBoxes` +
  `drawPrintMarks`, or just pass `bleed` and `marks` to `printIntent`.
- **PDF/A-2b and PDF/A-3** (ISO 19005; PDF/A-3 for factur-X / ZUGFeRD
  e-invoicing XML via `applyPdfA`).

## Usage

Pass `printIntent()` as a `postProcess` hook to `renderToBuffer`:

```ts
import { renderToBuffer } from '@imprint-pdf/react';
import { printIntent } from '@imprint-pdf/print';
import fogra39 from './icc/FOGRA39.icc'; // Uint8Array

const pdf = await renderToBuffer(element, {
  postProcess: [
    printIntent({
      intent: 'PDF/X-4',
      outputIntent: {
        iccProfile: fogra39,
        condition: 'ISO Coated v3',
        conditionIdentifier: 'FOGRA39',
        registry: 'http://www.color.org',
      },
      bleed: '3mm',
      marks: ['trim', 'registration'],
    }),
  ],
});
```

## PDF/A-3 + factur-X / ZUGFeRD

```ts
import { printIntent } from '@imprint-pdf/print';

const pdf = await renderToBuffer(element, {
  postProcess: [
    printIntent({
      intent: 'PDF/A-3B',
      facturX: {
        level: 'EN 16931',
        xml: xmlBytes, // Uint8Array
        filename: 'factur-x.xml',
      },
    }),
  ],
});
```

## Low-level helpers

| Export                | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `addOutputIntent`     | Writes a `/OutputIntents` entry to a `PDFDocument`     |
| `applyPdfA`           | Stamps PDF/A XMP signature + factur-X attachment       |
| `applyPageBoxes`      | Sets `MediaBox`, `BleedBox`, `TrimBox` on a page       |
| `drawPrintMarks`      | Draws crop/trim/registration marks in the bleed area   |
| `embedSpotColorSpace` | Registers a Separation colour space (PANTONE etc.)     |
| `embedOverprintState` | Returns an `ExtGState` ref with overprint enabled      |
| `rgbToCmyk`           | Naïve sRGB → CMYK (screen preview; no ICC management)  |
| `parseCmykClass`      | Parses `"0,100,100,0"` from a Tailwind arbitrary value |
| `cmykOperator`        | Formats CMYK values as a PDF `c m y k K` operator      |
| `parseBleed`          | Converts a CSS bleed string to `BleedBox` points       |
