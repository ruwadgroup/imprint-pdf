# @imprint-pdf/react

React components and reconciler for
[imprint-pdf](https://github.com/tamimbinhakim/imprint-pdf). Renders a
`Document` JSX tree to a PDF.

```bash
pnpm add @imprint-pdf/react @imprint-pdf/core tailwindcss
```

Works on React 18 and 19 with the same command — both reconciler majors are
bundled. The Tailwind compiler is bundled too.

## The whole API

```ts
import { pdf } from '@imprint-pdf/react';

// Response (default) — for Next.js, Hono, Bun.serve, edge handlers
const response = await pdf(<Invoice data={data} />);

// Uint8Array — for writing to disk, attaching to email, signing
const bytes    = await pdf(<Invoice data={data} />, { as: 'bytes' });

// ReadableStream — for streaming responses on edge runtimes
const stream   = await pdf(<Invoice data={data} />, { as: 'stream' });
```

Overloads narrow the return type by the literal value of `as` — TypeScript knows
the difference, no manual casts.

Auto-loads `imprint.config.ts` from the project root and merges with
caller-supplied options. Fonts, Tailwind, typography — all configured once.

## Components

### Document chrome

| Component      | Description                                               |
| -------------- | --------------------------------------------------------- |
| `<Document>`   | Root. Metadata, fonts, page defaults, embeds.             |
| `<Page>`       | One page. `size`, `orientation`, `bleed`, `padding`.      |
| `<Header>`     | Running header — re-laid-out per page.                    |
| `<Footer>`     | Running footer — re-laid-out per page.                    |
| `<Watermark>`  | Drawn behind page content on every page.                  |
| `<Bookmark>`   | Outline entry; doubles as a `#anchor` link target.        |
| `<PageNumber>` | Resolves to the current page index at draw time.          |
| `<TotalPages>` | Resolves to the document's total page count at draw time. |

### Content

Plain HTML elements are first-class — they emit `PdfNode` types with semantic
role tags, so PDF/UA tagging works automatically.

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

| Component | Description                                                |
| --------- | ---------------------------------------------------------- |
| `<Image>` | Raster image. `src`, `alt`, `objectFit`, `objectPosition`. |
| `<Svg>`   | SVG subtree → PDF vector operators.                        |
| `<Link>`  | URI or `#anchor` hyperlink annotation.                     |
| `<Chart>` | Wraps Recharts/Visx/ECharts SVG output, converted to PDF.  |

### Forms

| Component      | Description                                         |
| -------------- | --------------------------------------------------- |
| `<Form>`       | AcroForm container.                                 |
| `<TextField>`  | Single or multi-line text input.                    |
| `<Checkbox>`   | Boolean field.                                      |
| `<RadioGroup>` | Mutually exclusive option set.                      |
| `<Dropdown>`   | Select / combobox.                                  |
| `<Signature>`  | Signature widget (signing via `@imprint-pdf/sign`). |
| `<Button>`     | Push button — submit, reset, or JS action.          |

## Subpath entries

| Entry                           | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `@imprint-pdf/react`            | The default — components + `pdf()` + reconciler.       |
| `@imprint-pdf/react/standalone` | Edge build for Cloudflare Workers / Vercel Edge / Bun. |
| `@imprint-pdf/react/preset`     | Tailwind preset — `@import` it from your `app.css`.    |

## Print type scale

Tailwind's default type scale is tuned for screens. imprint ships a print-native
remap so `text-xs … text-9xl` resolve to correct point sizes out of the box —
import it alongside `tailwindcss`:

```css
@import 'tailwindcss';
@import '@imprint-pdf/react/preset';
```

imprint converts CSS to PDF points as `rem → px` (×16) `→ pt` (×0.75), so
**`pt = rem × 12`**. The preset sets each `--text-*` var accordingly:

| Token       | pt   | rem       |
| ----------- | ---- | --------- |
| `text-2xs`  | 6pt  | 0.5rem    |
| `text-xs`   | 7pt  | 0.5833rem |
| `text-sm`   | 8pt  | 0.6667rem |
| `text-base` | 9pt  | 0.75rem   |
| `text-lg`   | 11pt | 0.9167rem |
| `text-xl`   | 15pt | 1.25rem   |
| `text-2xl`  | 18pt | 1.5rem    |
| `text-3xl`  | 22pt | 1.8333rem |
| `text-4xl`  | 28pt | 2.3333rem |
| `text-5xl`  | 36pt | 3rem      |
| `text-6xl`  | 48pt | 4rem      |
| `text-7xl`  | 60pt | 5rem      |
| `text-8xl`  | 72pt | 6rem      |
| `text-9xl`  | 96pt | 8rem      |

`text-2xs` is an imprint-only addition for footnote-sized copy. Each size
carries a paired print line-height, and `leading-*` / `tracking-*` track
Tailwind's defaults (with `tracking-tight` nudged to -0.01em). The 0.25rem
spacing step is already print-sane (3pt), so it is left untouched.

See the
[imprint-pdf docs](https://github.com/tamimbinhakim/imprint-pdf/tree/main/docs)
for the full surface.
