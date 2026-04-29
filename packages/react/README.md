# @imprint/react

React components and custom reconciler for
[Imprint](https://github.com/tamimbinhakim/imprint).

```bash
pnpm add @imprint/react @imprint/core
```

## Components

### Layout

| Component    | Description                                         |
| ------------ | --------------------------------------------------- |
| `<Document>` | Root. Carries metadata, intent, fonts, output mode. |
| `<Page>`     | One page. Props: `size`, `orientation`, `bleed`.    |
| `<View>`     | Block/Flex/Grid container. Maps to a `<div>`.       |

### Content

| Component  | Description                                              |
| ---------- | -------------------------------------------------------- |
| `<Text>`   | Inline text run. Supports HarfBuzz shaping.              |
| `<Image>`  | Raster image. Accepts `src`, `alt`, `objectFit`.         |
| `<Svg>`    | SVG subtree. Converted to PDF vector operators.          |
| `<Link>`   | External hyperlink annotation.                           |
| `<Bullet>` | Unordered list item marker.                              |

### HTML aliases

Plain HTML elements are fully supported — they emit the same `PdfNode` types
with semantic role tags so PDF/UA tagging works automatically.

```tsx
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-base leading-relaxed">Body copy.</p>
<ul><li>Item</li></ul>
<table>…</table>
```

### Forms (AcroForms)

| Component      | Description                                          |
| -------------- | ---------------------------------------------------- |
| `<Form>`       | AcroForm container.                                  |
| `<TextField>`  | Single or multi-line text input.                     |
| `<Checkbox>`   | Boolean field.                                       |
| `<RadioGroup>` | Mutually exclusive option set.                       |
| `<Dropdown>`   | Select/combobox.                                     |
| `<Signature>`  | Signature widget (Enterprise signing via `@imprint/sign`). |
| `<Button>`     | Submit, reset, or JS action button.                  |

### Charts

| Component | Description                                            |
| --------- | ------------------------------------------------------ |
| `<Chart>` | Wraps a Recharts/Visx/ECharts/D3 tree and converts the SVG output to PDF vector ops. |

## API

### `renderToBuffer`

```tsx
import { renderToBuffer, Document, Page } from '@imprint/react';

const bytes = await renderToBuffer(
  <Document>
    <Page size="A4" className="p-12 font-sans">
      <h1 className="text-3xl font-bold">Hello, PDF</h1>
    </Page>
  </Document>,
  { fonts: ['Inter'] }
);
```

Returns `Uint8Array`. Works on Node, Bun, and browser.

### `renderToStream`

```ts
import { renderToStream } from '@imprint/react/standalone';
import wasm from '@imprint/react/imprint.wasm';
```

Returns `ReadableStream<Uint8Array>`. Designed for Cloudflare Workers and
Vercel Edge Functions where you import WASM as a static asset.

### `renderToServer`

```tsx
import { renderToServer } from '@imprint/react/server';
```

RSC-aware version that can run inside Next.js Server Components and route
handlers without any WASM loading ceremony.

## Subpath entries

| Entry                    | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `@imprint/react`         | All components + `renderToBuffer`        |
| `@imprint/react/server`  | `renderToServer` for RSC / route handlers |
| `@imprint/react/standalone` | `renderToStream` + manual WASM loading for edge |
