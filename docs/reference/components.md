# Component reference

All component props. Every component accepts `className` (Tailwind) and `style`
(inline CSS object) on top of what's listed.

## `<Document>`

| Prop           | Type                                      | Default | Description                                       |
| -------------- | ----------------------------------------- | ------- | ------------------------------------------------- |
| `title`        | `string`                                  | —       | PDF title metadata.                               |
| `author`       | `string`                                  | —       | Author metadata.                                  |
| `subject`      | `string`                                  | —       | Subject metadata.                                 |
| `keywords`     | `string[]`                                | —       | Keywords metadata.                                |
| `lang`         | `string`                                  | `'en'`  | BCP-47 language. Required for PDF/UA.             |
| `intent`       | `'PDF/X-4' \| 'PDF/A-2b' \| …`            | —       | Output intent. Requires `@imprint-pdf/print`.     |
| `outputIntent` | `{ profile: string; condition?: string }` | —       | ICC output intent. Requires `@imprint-pdf/print`. |
| `embeds`       | `EmbedSpec[]`                             | —       | Attached files (PDF/A-3 / ZUGFeRD).               |

## `<Page>`

| Prop          | Type                         | Default      | Description                        |
| ------------- | ---------------------------- | ------------ | ---------------------------------- |
| `size`        | `'A4' \| 'Letter' \| [w, h]` | `'A4'`       | Page size. Custom: `[mm_w, mm_h]`. |
| `sizeUnit`    | `'mm' \| 'pt' \| 'in'`       | `'mm'`       | Unit for custom size tuple.        |
| `orientation` | `'portrait' \| 'landscape'`  | `'portrait'` | Page orientation.                  |
| `bleed`       | `string`                     | —            | Bleed area.                        |
| `marks`       | `string`                     | —            | Trim/registration marks.           |

## HTML containers

HTML elements are first-class — no `<View>` or `<Text>` wrapper. Same
`className` and `style` surface as imprint-pdf components, same `PdfNode`
output.

Recognised: `<div>`, `<span>`, `<p>`, `<h1>`–`<h6>`, `<ul>`, `<ol>`, `<li>`,
`<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<td>`, `<th>`, `<a>` (alias
for `<Link>`), `<img>` (alias for `<Image>`), `<section>`, `<article>`,
`<aside>`, `<header>`, `<footer>`, `<main>`, `<nav>`, `<figure>`,
`<figcaption>`, `<blockquote>`, `<pre>`, `<code>`, `<strong>`, `<em>`,
`<small>`, `<label>`.

## `<Image>`

| Prop        | Type                             | Default     | Description                    |
| ----------- | -------------------------------- | ----------- | ------------------------------ |
| `src`       | `string`                         | required    | File path or URL.              |
| `alt`       | `string`                         | required    | Alt text. Required for PDF/UA. |
| `objectFit` | `'contain' \| 'cover' \| 'fill'` | `'contain'` | Image sizing within its box.   |

## `<Svg>`

| Prop  | Type     | Default  | Description        |
| ----- | -------- | -------- | ------------------ |
| `src` | `string` | required | SVG markup string. |

## `<Link>`

| Prop   | Type     | Default  | Description                                                                  |
| ------ | -------- | -------- | ---------------------------------------------------------------------------- |
| `href` | `string` | required | External URL or `#anchor` referencing a `<Bookmark>` title in this document. |

## `<Header>` / `<Footer>`

Document-level children of `<Document>`. Re-laid out and stamped on every page.
No extra props beyond `className` / `style`.

## `<Watermark>`

Document-level child of `<Document>`. Drawn behind page content on every page.
No extra props beyond `className` / `style`.

## `<Bookmark>`

| Prop    | Type     | Default  | Description                                                             |
| ------- | -------- | -------- | ----------------------------------------------------------------------- |
| `title` | `string` | required | Outline label and slug used to resolve `<Link href="#…">` destinations. |
| `level` | `1`–`6`  | `1`      | Heading level — controls indentation in the PDF outline.                |

## `<PageNumber>` / `<TotalPages>`

No props. Render as inline text — resolved at draw time.

## `<Form>`

| Prop   | Type     | Default  | Description               |
| ------ | -------- | -------- | ------------------------- |
| `name` | `string` | required | AcroForm dictionary name. |

## `<TextField>`

| Prop           | Type                     | Default  | Description                         |
| -------------- | ------------------------ | -------- | ----------------------------------- |
| `name`         | `string`                 | required | Field name in the AcroForm.         |
| `type`         | `'text' \| 'email' \| …` | `'text'` | Field semantic type.                |
| `required`     | `boolean`                | `false`  | Required field flag.                |
| `multiline`    | `boolean`                | `false`  | Multi-line text area.               |
| `maxLength`    | `number`                 | —        | Maximum character count.            |
| `defaultValue` | `string`                 | —        | Pre-filled value.                   |
| `placeholder`  | `string`                 | —        | Placeholder text (appearance only). |

## `<Checkbox>`

| Prop             | Type      | Default  | Description |
| ---------------- | --------- | -------- | ----------- |
| `name`           | `string`  | required |             |
| `required`       | `boolean` | `false`  |             |
| `defaultChecked` | `boolean` | `false`  |             |

## `<RadioGroup>`

| Prop           | Type                                      | Default  | Description |
| -------------- | ----------------------------------------- | -------- | ----------- |
| `name`         | `string`                                  | required |             |
| `options`      | `Array<{ value: string; label: string }>` | required |             |
| `defaultValue` | `string`                                  | —        |             |

## `<Dropdown>`

| Prop      | Type                                      | Default  | Description |
| --------- | ----------------------------------------- | -------- | ----------- |
| `name`    | `string`                                  | required |             |
| `options` | `Array<{ value: string; label: string }>` | required |             |

## `<Signature>`

| Prop          | Type     | Default  | Description                                    |
| ------------- | -------- | -------- | ---------------------------------------------- |
| `name`        | `string` | required | Field name.                                    |
| `certificate` | `string` | —        | PEM certificate. Requires `@imprint-pdf/sign`. |
| `privateKey`  | `string` | —        | PEM private key. Requires `@imprint-pdf/sign`. |

## `<Button>`

| Prop     | Type           | Default  | Description                                                |
| -------- | -------------- | -------- | ---------------------------------------------------------- |
| `name`   | `string`       | required |                                                            |
| `action` | `ButtonAction` | required | `{ type: 'submitForm' \| 'resetForm' \| 'JavaScript'; … }` |

## `<Chart>`

| Prop     | Type     | Default | Description                                                 |
| -------- | -------- | ------- | ----------------------------------------------------------- |
| `width`  | `number` | —       | Override SVG width (px). Inferred from children if omitted. |
| `height` | `number` | —       | Override SVG height (px).                                   |
