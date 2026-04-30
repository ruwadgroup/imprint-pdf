# Components

Every Imprint component maps to a `PdfNode` in the IR. All accept a `className`
prop for Tailwind styling and a `style` prop for inline overrides.

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
  intent="PDF/X-4" // Enterprise — @imprint/print
  outputIntent={{ profile: 'FOGRA39', condition: 'ISO Coated v3' }}
>
  {/* <Page> children */}
</Document>
```

| Prop     | Type                           | Default | Description                               |
| -------- | ------------------------------ | ------- | ----------------------------------------- |
| `title`  | `string`                       | —       | PDF document title (XMP + DocInfo).       |
| `author` | `string`                       | —       | Author field.                             |
| `lang`   | `string` (BCP-47)              | `'en'`  | Document language. Required for PDF/UA.   |
| `intent` | `'PDF/X-4' \| 'PDF/A-2b' \| …` | —       | Output intent. Requires `@imprint/print`. |

### `<Page>`

A single page. Imprint computes page breaks automatically — you do not need to
decide which content goes on which page unless you want explicit control.

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
| `bleed`       | `string` (CSS length)        | —            | Bleed area. Enterprise (`@imprint/print`).  |
| `marks`       | `string`                     | —            | Trim/registration marks.                    |

### `<View>`

Block/flex/grid container. The workhorse.

```tsx
<View className="grid grid-cols-12 gap-6">
  <View className="col-span-8">…</View>
  <View className="col-span-4">…</View>
</View>
```

## Content

### `<Text>`

Explicit text container for when you need fine-grained typography control. In
most cases you can use `<p>`, `<span>`, etc. directly.

```tsx
<Text
  hyphenation="auto"
  textAlign="justify"
  className="text-base leading-relaxed"
>
  Long paragraph copy here…
</Text>
```

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

External hyperlink annotation.

```tsx
<Link href="https://acme.com" className="text-blue-600 underline">
  acme.com
</Link>
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
