# Component reference

All component props. Every component also accepts `className` (Tailwind) and
`style` (inline CSS object).

## `<Document>`

| Prop           | Type                                      | Default | Description                                   |
| -------------- | ----------------------------------------- | ------- | --------------------------------------------- |
| `title`        | `string`                                  | —       | PDF title metadata.                           |
| `author`       | `string`                                  | —       | Author metadata.                              |
| `subject`      | `string`                                  | —       | Subject metadata.                             |
| `keywords`     | `string[]`                                | —       | Keywords metadata.                            |
| `lang`         | `string`                                  | `'en'`  | BCP-47 language. Required for PDF/UA.         |
| `intent`       | `'PDF/X-4' \| 'PDF/A-2b' \| …`            | —       | Output intent. Requires `@imprint/print`.     |
| `outputIntent` | `{ profile: string; condition?: string }` | —       | ICC output intent. Requires `@imprint/print`. |
| `embeds`       | `EmbedSpec[]`                             | —       | Attached files (PDF/A-3 / ZUGFeRD).           |

## `<Page>`

| Prop          | Type                         | Default      | Description                          |
| ------------- | ---------------------------- | ------------ | ------------------------------------ |
| `size`        | `'A4' \| 'Letter' \| [w, h]` | `'A4'`       | Page size. Custom: `[mm_w, mm_h]`.   |
| `sizeUnit`    | `'mm' \| 'pt' \| 'in'`       | `'mm'`       | Unit for custom size tuple.          |
| `orientation` | `'portrait' \| 'landscape'`  | `'portrait'` | Page orientation.                    |
| `bleed`       | `string`                     | —            | Bleed area. Enterprise.              |
| `marks`       | `string`                     | —            | Trim/registration marks. Enterprise. |

## `<View>`

Container. Maps to a `<div>`. No additional props beyond `className` / `style`.

## `<Text>`

| Prop           | Type                        | Default        | Description               |
| -------------- | --------------------------- | -------------- | ------------------------- |
| `hyphenation`  | `'auto' \| 'none'`          | config default | Hyphenation for this run. |
| `lineBreaking` | `'knuth-plass' \| 'greedy'` | config default | Line-break algorithm.     |

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

| Prop   | Type     | Default  | Description      |
| ------ | -------- | -------- | ---------------- |
| `href` | `string` | required | Destination URL. |

## `<PageNumber>` / `<TotalPages>`

No props. Render as inline text.

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

| Prop          | Type     | Default  | Description                                            |
| ------------- | -------- | -------- | ------------------------------------------------------ |
| `name`        | `string` | required | Field name.                                            |
| `certificate` | `string` | —        | PEM certificate. Requires `@imprint/sign`. Enterprise. |
| `privateKey`  | `string` | —        | PEM private key. Requires `@imprint/sign`. Enterprise. |

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
