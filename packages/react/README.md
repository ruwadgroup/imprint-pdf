# @imprint-pdf/react

React components and custom reconciler for
[Imprint](https://github.com/tamimbinhakim/imprint-pdf).

```bash
pnpm add @imprint-pdf/react @imprint-pdf/core
```

## Components

### Document chrome

| Component      | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| `<Document>`   | Root. Carries metadata, fonts, page defaults, embeds.       |
| `<Page>`       | One page. Props: `size`, `orientation`, `bleed`, `padding`. |
| `<Header>`     | Running header — re-laid out and stamped on every page.     |
| `<Footer>`     | Running footer — re-laid out and stamped on every page.     |
| `<Watermark>`  | Drawn behind page content on every page.                    |
| `<Bookmark>`   | Outline entry; doubles as a `#anchor` link target.          |
| `<PageNumber>` | Resolves to the current page index at draw time.            |
| `<TotalPages>` | Resolves to the document's total page count at draw time.   |

### Content — use HTML elements

Plain HTML elements are first-class. They emit the same `PdfNode` types with
semantic role tags, so PDF/UA tagging works automatically.

```tsx
<div className="flex flex-row gap-4">
  <h1 className="text-3xl font-bold">Title</h1>
  <p className="text-base leading-relaxed">Body copy.</p>
  <ul>
    <li>Item</li>
  </ul>
  <table>
    <tr>
      <td>cell</td>
    </tr>
  </table>
</div>
```

Recognised: `<div>`, `<span>`, `<p>`, `<h1>`–`<h6>`, `<ul>`, `<ol>`, `<li>`,
`<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<td>`, `<th>`, `<a>`,
`<img>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`, `<main>`,
`<nav>`, `<figure>`, `<figcaption>`, `<blockquote>`, `<pre>`, `<code>`,
`<strong>`, `<em>`, `<small>`, `<label>`.

### Imprint-specific content

| Component | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `<Image>` | Raster image. `src`, `alt`, `objectFit`, `objectPosition`.      |
| `<Svg>`   | SVG subtree. Converted to PDF vector operators (gradients WIP). |
| `<Link>`  | URI or `#anchor` hyperlink annotation.                          |
| `<Chart>` | Wraps Recharts/Visx/ECharts and converts the SVG output to PDF. |

### Forms (AcroForms)

| Component      | Description                                         |
| -------------- | --------------------------------------------------- |
| `<Form>`       | AcroForm container.                                 |
| `<TextField>`  | Single or multi-line text input.                    |
| `<Checkbox>`   | Boolean field.                                      |
| `<RadioGroup>` | Mutually exclusive option set.                      |
| `<Dropdown>`   | Select / combobox.                                  |
| `<Signature>`  | Signature widget (signing via `@imprint-pdf/sign`). |
| `<Button>`     | Push button — submit, reset, or JS action.          |

## API

### `renderToBuffer`

```tsx
import { renderToBuffer, Document, Page } from '@imprint-pdf/react';

const bytes = await renderToBuffer(
  <Document title="Hello">
    <Page size="A4" className="p-12 font-sans">
      <h1 className="text-3xl font-bold">Hello, PDF</h1>
    </Page>
  </Document>,
  { fonts },
);
```

Returns `Uint8Array`. Works on Node, Bun, and browser.

### `renderToStream`

```ts
import { renderToStream } from '@imprint-pdf/react/standalone';
```

Returns `ReadableStream<Uint8Array>`. Designed for Cloudflare Workers and Vercel
Edge Functions where you import WASM as a static asset.

## Subpath entries

| Entry                           | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `@imprint-pdf/react`            | All components + `renderToBuffer`               |
| `@imprint-pdf/react/standalone` | `renderToStream` + manual WASM loading for edge |
