# Components

Every imprint-pdf component maps to a `PdfNode` in the IR. All accept a
`className` prop for Tailwind styling and a `style` prop for inline overrides.

## Layout

### `<Document>`

Root component. Required. Carries document-level metadata and config.

```tsx
<Document
  title="Invoice #INV-001"
  author="Acme Corp"
  subject="Invoice"
  keywords={['invoice', 'acme']}
  lang="en-US"
  intent="PDF/X-4" // via @imprint-pdf/print
  outputIntent={{ profile: 'FOGRA39', condition: 'ISO Coated v3' }}
>
  {/* <Page> children */}
</Document>
```

| Prop     | Type                           | Default | Description                                   |
| -------- | ------------------------------ | ------- | --------------------------------------------- |
| `title`  | `string`                       | —       | PDF document title (XMP + DocInfo).           |
| `author` | `string`                       | —       | Author field.                                 |
| `lang`   | `string` (BCP-47)              | `'en'`  | Document language. Required for PDF/UA.       |
| `intent` | `'PDF/X-4' \| 'PDF/A-2b' \| …` | —       | Output intent. Requires `@imprint-pdf/print`. |

### `<Page>`

A single page. imprint-pdf computes page breaks automatically — you do not need
to decide which content goes on which page unless you want explicit control.

```tsx
<Page
  size="A4"
  orientation="portrait"
  bleed="3mm"
  marks="trim,registration"
  className="p-12 font-sans bg-white"
>
```

| Prop          | Type                         | Default      | Description                                 |
| ------------- | ---------------------------- | ------------ | ------------------------------------------- |
| `size`        | `'A4' \| 'Letter' \| [w, h]` | `'A4'`       | Page dimensions. Custom: `[210, 297]` (mm). |
| `orientation` | `'portrait' \| 'landscape'`  | `'portrait'` |                                             |
| `bleed`       | `string` (CSS length)        | —            | Bleed area. Via `@imprint-pdf/print`.       |
| `marks`       | `string`                     | —            | Trim/registration marks.                    |

### Containers — use HTML

imprint-pdf doesn't ship a `<View>` or `<Text>` component. Use HTML elements
directly — they're first-class and emit the same `PdfNode` types.

```tsx
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-8">…</div>
  <div className="col-span-4">…</div>
</div>

<p className="text-base leading-relaxed">Long paragraph copy here…</p>
```

Recognised: `<div>`, `<span>`, `<p>`, `<h1>`–`<h6>`, `<ul>`, `<ol>`, `<li>`,
`<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<td>`, `<th>`, `<a>`,
`<img>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`, `<main>`,
`<nav>`, `<figure>`, `<figcaption>`, `<blockquote>`, `<pre>`, `<code>`,
`<strong>`, `<em>`, `<small>`, `<label>`.

## Content

### `<Image>`

Raster image. Accepted formats: JPEG, PNG, WebP, AVIF, GIF (first frame).

```tsx
<Image
  src="./public/logo.png"
  alt="Acme Corp logo"
  className="h-16 w-auto"
  objectFit="contain"
/>
```

### `<Svg>`

SVG subtree. Pass a string or a React SVG element. Converted to PDF vector
operators (not rasterized) unless the SVG uses unsupported features like CSS
filters, in which case resvg-wasm rasterizes it.

```tsx
<Svg src={svgString} className="h-24 w-24" />
```

### `<Link>`

Hyperlink annotation. `href` may be an external URL or `#anchor` — the latter
resolves to a `<Bookmark>` with the matching title in this document.

```tsx
<Link href="https://acme.com" className="text-blue-600 underline">
  acme.com
</Link>

<Link href="#chapter-two">Jump to Chapter Two</Link>
```

## Document-level chrome

Place these as direct children of `<Document>` (siblings of `<Page>`). They're
re-laid out per page and stamped automatically.

### `<Header>` / `<Footer>`

Running header and footer. Use `<PageNumber>` / `<TotalPages>` inside to inject
the current page index.

```tsx
<Document>
  <Header className="flex flex-row justify-between p-6 text-xs">
    <span>Annual Report</span>
    <span>Acme Corp</span>
  </Header>
  <Footer className="flex flex-row justify-end p-6 text-xs">
    <PageNumber /> / <TotalPages />
  </Footer>
  <Page size="A4">…</Page>
  <Page size="A4">…</Page>
</Document>
```

### `<Watermark>`

Drawn behind page content on every page.

```tsx
<Watermark className="absolute inset-0 flex items-center justify-center">
  <span className="text-6xl font-bold text-gray-200 -rotate-30">DRAFT</span>
</Watermark>
```

### `<Bookmark>`

Registers an entry in the PDF outline. Doubles as a named destination — any
`<Link href="#title">` resolves to the page containing the bookmark.

```tsx
<Page size="A4">
  <Bookmark title="Chapter Two" level={1} />
  <h1>Chapter Two</h1>
</Page>
```

## HTML aliases

Plain HTML is supported. These elements map to the same `PdfNode` types with
semantic role tags:

```tsx
<h1 className="text-3xl font-bold">Heading</h1>
<p className="mt-4 leading-relaxed">Paragraph.</p>
<ul className="mt-2 list-disc pl-6">
  <li>Item one</li>
  <li>Item two</li>
</ul>
<table className="w-full border-collapse">
  <thead>
    <tr><th className="border p-2">Column</th></tr>
  </thead>
  <tbody>
    <tr><td className="border p-2">Cell</td></tr>
  </tbody>
</table>
```

## Forms — see [Forms guide](forms.md)

`<Form>`, `<TextField>`, `<Checkbox>`, `<RadioGroup>`, `<Dropdown>`,
`<Signature>`, `<Button>`.

## Charts — see [Charts guide](charts.md)

`<Chart>` — wraps Recharts, Visx, ECharts, D3 trees and converts their SVG
output to PDF vector ops.
