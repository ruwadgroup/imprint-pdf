# Architecture - Print fidelity (alignment, full Tailwind, print scale)

This sketches the three structural changes: the text line-box model, the new
`ResolvedStyle` fields + writer support, and the shippable print `@theme`.

## 1. Text line-box model (alignment)

### Before (buggy)

`measureText` returns a box of height `lineHeight` and `drawText` places the
baseline at `top + fontSize`. There is no ascent/descent, so the glyphs sit
optically low inside the box. When the text node is a flex child with
`items-center`, Taffy centers the _box_, but the visual glyph centre is below
the box centre - so a sibling rule centred on the same row crosses _through_ the
glyphs.

```
box top ┌───────────────┐  ← Taffy centres THIS edge-pair
        │   (empty)      │
        │  S F O         │  ← glyph cap area
baseline├───────────────┤  ← drawText: top + fontSize  (box bottom when leading-none)
        └───────────────┘
                ▲ sibling rule (items-center) lands here, through the glyphs
```

### After (CSS half-leading model)

`measureText` exposes per-line `ascent`/`descent` from the font (fall back to
`0.8 * size` / `0.2 * size` for standard fonts where fontkit metrics are
unavailable). The line box distributes leading evenly:

```
halfLeading = (lineHeight - (ascent + descent)) / 2
baselineFromTop = halfLeading + ascent
```

`drawText` uses `baselineFromTop` instead of `fontSize`. Now the glyph optical
centre coincides with the line-box centre, so `items-center` aligns a sibling
rule to the visual middle of the text. `leading-none` (lineHeight = size) still
works: half-leading goes slightly negative and the glyphs fill the box, matching
browser behaviour.

## 2. Intrinsic text sizing (overlap)

### Before

`taffy-adapter.ts:259` sets `minSize.width = 0` for every node as a blanket hack
so text columns can shrink and re-wrap. Side effect: short text nodes in a
`justify-center` / `justify-between` row collapse to ~0 width and **overlap**.

### After

The Taffy leaf measure callback honours `availableSpace`:

- `availableSpace.width === MinContent` → return the **longest unbreakable word
  width** (text's true minimum; it may wrap but never narrower than this).
- `availableSpace.width === MaxContent` → return the single-line width.
- a concrete width → wrap to it (current behaviour).

With a real min-content width reported, the blanket `minSize.width = 0` hack is
removed; Taffy reserves each text node's minimum, so `SFO`, `◆`, `JFK` no longer
stack. Wrapping multi-word paragraphs still shrink because their min-content is
only the longest single word, not the whole string. The resume-column regression
the hack originally fixed is covered by a golden test.

## 3. New `ResolvedStyle` fields + writer support

| Field                                                                | Source utility                                                      | Writer behaviour                                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `borderStyle` (+ per-side)                                           | `border-dashed/dotted/double`                                       | dash array on the stroke in `drawNode`; `double` = two concentric strokes            |
| `backgroundImage` carrying `linear-gradient()` / `radial-gradient()` | `bg-linear-*`, `bg-radial-*`, arbitrary `bg-[linear-gradient(...)]` | parse stops → PDF axial/radial **shading dict**, reusing `writer/svg/gradients.ts`   |
| `textShadow`                                                         | `text-shadow-*`                                                     | draw the glyph run once in the shadow colour at the offset, then the real run on top |
| `backgroundSize` / `backgroundPosition` / `backgroundRepeat`         | `bg-cover/contain`, `bg-center`, …                                  | applied to `url()` backgrounds via the existing image-fit code path                  |
| `listStyleType` / `listStylePosition`                                | `list-disc/decimal/none`, `list-inside`                             | `<li>` markers rendered from the resolved type instead of hardcoded                  |

`display: inline-block` maps to a shrink-to-fit block (Taffy: `flex` leaf with
`flex: 0 0 auto`, width = max-content). `columns` / `column-count` is a Taffy
container that fragments children into N equal columns.

Genuinely impossible in a static PDF and therefore **out of scope**: runtime
animation/transition, hover/focus/active and other interactive variants,
scroll/overflow-scroll, backdrop filters, and pixel filters (blur/brightness…).
These stay in the eslint `no-unsupported-css` list; everything we now support is
removed from it.

## 4. Print `@theme` preset

imprint ships an importable stylesheet, `@imprint-pdf/react/preset.css`, that
consumers add with a single `@import` above `@import "tailwindcss"`. It
redefines Tailwind's type + spacing scale to print-native point values so
`text-xs … 9xl`, `leading-*`, `tracking-*` resolve to correct sizes and authors
never reach for raw `text-[Npx]`.

Proposed print scale (rem values chosen so the existing px→pt path yields these
points; `1rem = 16px = 12pt`):

| token            | pt  | token            | pt                |
| ---------------- | --- | ---------------- | ----------------- |
| `text-2xs` (new) | 6   | `text-xl`        | 15                |
| `text-xs`        | 7   | `text-2xl`       | 18                |
| `text-sm`        | 8   | `text-3xl`       | 22                |
| `text-base`      | 9   | `text-4xl`       | 28                |
| `text-lg`        | 11  | `text-5xl`       | 36                |
|                  |     | `text-6xl`…`9xl` | 48 / 60 / 72 / 96 |

Default `leading-*` and `tracking-*` are tuned for body copy (e.g.
`leading-snug` ≈ 1.3, `tracking-tight` ≈ -0.01em). Spacing scale stays
Tailwind's default (0.25rem step = 3pt) which is already print-sane. The preset
is opt-in: omit the import and you get stock Tailwind sizes.
