# @imprint/print

Enterprise print-ready output for
[Imprint](https://github.com/tamimbinhakim/imprint).

**License: Business Source License 1.1.** Reverts to Apache-2.0 after four
years. Commercial use requires a license — see
[`LICENSING.md`](../../LICENSING.md).

```bash
pnpm add @imprint/print
```

## What it adds

- **PDF/X-4 and PDF/X-4p** output intent with embedded ICC profiles (Coated
  FOGRA39 / PSO Coated v3 by default; bring your own ICC file).
- **CMYK colour pipeline.** Tailwind colors convert from OKLCH/sRGB to CMYK via
  Little CMS (lcms2 compiled to WASM). Use `imprint:cmyk-[c_m_y_k]` Tailwind
  variants for explicit CMYK values.
- **Spot colors.** `imprint:spot-[Pantone-185-C]` and overprint via
  `imprint:overprint`.
- **Bleed, trim, crop, and registration marks.**
  `<Page bleed="3mm" marks="trim,registration">`.
- **PDF/A-2b and PDF/A-3** (ISO 19005 archival format; PDF/A-3 for embedded
  factur-X / ZUGFeRD e-invoicing XML).
- **veraPDF validation** via `imprint validate --profile pdf-x-4`.

## Usage

```tsx
import { renderToBuffer, Document, Page } from '@imprint/react';
import '@imprint/print'; // registers the print writer

const pdf = await renderToBuffer(
  <Document
    intent="PDF/X-4"
    outputIntent={{ profile: 'FOGRA39', condition: 'ISO Coated v3' }}
  >
    <Page
      size="A4"
      bleed="3mm"
      marks="trim,registration"
      className="imprint:cmyk-[0_0.95_0.85_0]"
    >
      <Brochure />
    </Page>
  </Document>,
);
```

## Tailwind variants

| Variant                  | Description                    |
| ------------------------ | ------------------------------ |
| `imprint:cmyk-[c_m_y_k]` | Direct CMYK values (0–1 each). |
| `imprint:spot-[name]`    | Spot colour by name.           |
| `imprint:overprint`      | PDF overprint flag.            |
| `imprint:bleed-[size]`   | Bleed area size (CSS length).  |

## Factur-X / ZUGFeRD (PDF/A-3)

```tsx
<Document
  intent="PDF/A-3"
  embeds={[{ name: 'factur-x.xml', data: xmlBytes, relationship: 'Alternative' }]}
>
```
