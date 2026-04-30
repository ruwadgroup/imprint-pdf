# Paged layout

PDFs are paged by definition. Imprint implements the CSS Paged Media features
browsers support only in print-preview mode — and adds Plass-style global page
breaking that browsers still do not have.

## Automatic page breaking

Imprint breaks pages automatically. You do not need to decide which content goes
on which page. The Plass two-pass page algorithm:

1. Runs Knuth–Plass paragraph breaking to get optimal line boxes.
2. Distributes line boxes across pages using a dynamic-programming cost function
   that penalises widows, orphans, and bad float interactions.

The result: widows and orphans are minimised across the whole document, not just
per-paragraph.

## Manual break control

```tsx
// Force a page break before this heading
<h2 className="break-before-page mt-0">Chapter 2</h2>

// Force a break after this section
<section className="break-after-page">…</section>

// Prevent a break inside this element
<div className="break-inside-avoid">
  <img … />
  <p className="mt-2 text-sm text-gray-500">Figure 1. Revenue by quarter.</p>
</div>

// Avoid a break after headings (keeps heading with following paragraph)
<h3 className="break-after-avoid">Section title</h3>
```

Supported values: `break-before-auto`, `break-before-page`, `break-before-left`,
`break-before-right`, `break-before-avoid`, and the same for `break-after` and
`break-inside`.

## Widows and orphans

```tsx
// Require at least 3 lines at the bottom / top of a page
<p className="[orphans:3] [widows:3]">Long copy…</p>
```

Default: `orphans: 2`, `widows: 2`.

## Page size and orientation

```tsx
// Named sizes
<Page size="A4" />
<Page size="Letter" />
<Page size="Legal" />

// Custom size in mm
<Page size={[210, 297]} />

// Custom size in points
<Page size={[595.28, 841.89]} sizeUnit="pt" />

// Landscape
<Page size="A4" orientation="landscape" />
```

## Running headers and footers

Use `position: absolute` inside a `<Page>` to pin elements to the page margins.
The `<PageNumber>` and `<TotalPages>` components resolve at render time.

```tsx
<Page className="relative pt-16 pb-12 px-12">
  {/* Header */}
  <div className="absolute top-0 inset-x-0 h-12 flex items-center px-12 border-b">
    <span className="text-xs text-gray-500 font-medium">
      Acme Corp Q1 Report
    </span>
    <span className="ml-auto text-xs text-gray-400">
      Page <PageNumber /> of <TotalPages />
    </span>
  </div>

  {/* Content */}
  <div>…</div>

  {/* Footer */}
  <div className="absolute bottom-0 inset-x-0 h-10 flex items-center px-12 border-t">
    <span className="text-xs text-gray-400">Confidential</span>
  </div>
</Page>
```

## `@page` equivalents

CSS `@page` rules are expressed as `<Page>` and `<Document>` props:

| CSS `@page`         | Imprint equivalent                        |
| ------------------- | ----------------------------------------- |
| `size: A4 portrait` | `<Page size="A4" orientation="portrait">` |
| `margin: 20mm`      | `<Page className="p-[20mm]">`             |
| `marks: trim crop`  | `<Page marks="trim,crop">` (Enterprise)   |
| `bleed: 3mm`        | `<Page bleed="3mm">` (Enterprise)         |
| `:first`            | `page-first:` Tailwind variant            |
| `:left` / `:right`  | `page-left:` / `page-right:` variants     |

## Footnotes

Footnotes are on the v1.5 roadmap. The current pattern is to use a fixed
`<div className="absolute bottom-12 …">` inside `<Page>`.
