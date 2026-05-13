# Paged layout

PDFs are paged by definition. imprint-pdf implements the CSS Paged Media
features browsers only support in print preview — and adds the Plass-style
global page breaking browsers still don't have.

## Automatic page breaking

Pages break automatically. You don't decide which content goes where. The Plass
two-pass algorithm:

1. Run Knuth–Plass paragraph breaking for optimal line boxes.
2. Distribute line boxes across pages via a DP cost function that penalises
   widows, orphans, and bad float interactions.

Result: widows and orphans minimised across the whole document, not just
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

Supported: `break-before-auto`, `break-before-page`, `break-before-left`,
`break-before-right`, `break-before-avoid`, and the equivalents for
`break-after` and `break-inside`.

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

Use `position: absolute` inside a `<Page>` to pin elements to the margins.
`<PageNumber>` and `<TotalPages>` resolve at draw time.

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

CSS `@page` rules become `<Page>` and `<Document>` props:

| CSS `@page`         | imprint-pdf equivalent                    |
| ------------------- | ----------------------------------------- |
| `size: A4 portrait` | `<Page size="A4" orientation="portrait">` |
| `margin: 20mm`      | `<Page className="p-[20mm]">`             |
| `marks: trim crop`  | `<Page marks="trim,crop">`                |
| `bleed: 3mm`        | `<Page bleed="3mm">`                      |
| `:first`            | `page-first:` Tailwind variant            |
| `:left` / `:right`  | `page-left:` / `page-right:` variants     |

## Footnotes

Footnotes are on the v1.5 roadmap. For now, use a fixed
`<div className="absolute bottom-12 …">` inside `<Page>`.
