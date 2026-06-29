---
id: 005
title:
  Print fidelity - text alignment engine, full static Tailwind support, print
  size preset
slug: 005-print-fidelity
status: done
tags:
  [
    area:core,
    area:tailwind,
    area:fixtures,
    type:fix,
    type:feat,
    theme:print-fidelity,
  ]
priority: P0
severity: high
effort: L
risk:
  Touches the text line-box, the Taffy leaf measure callback, the writer border/
  background paths, and a new shipped @theme. Any of these can shift every
  rendered document; the node-cli visual corpus + golden tests are the safety
  net and must be re-inspected after each unit.
planned_at: { commit: ab8e14f, date: 2026-06-29 }
depends_on: []
mockups:
  interface: null
  architecture: arch.md
research: null
---

# PRD 005: Print fidelity - text alignment engine, full static Tailwind support, print size preset

> **Executor instructions**: This PRD is portable - everything you need is in
> this file and `arch.md`. Follow it top to bottom. This refactors the core
> text-layout and writer paths, so the **node-cli visual corpus + golden/visual
> tests are your safety net** - regenerate and re-inspect after every unit, and
> never let a golden move without understanding why. If a STOP condition fires,
> stop and report - do not improvise.

## Problem

imprint-pdf renders React + Tailwind to PDF without Chromium. Three classes of
defect make it fall short of "pixel-perfect print":

1. **Alignment is broken.** Text has no real line-box: `drawText` places the
   baseline at `top + fontSize` and the layout box height is just `lineHeight`,
   with no ascent/descent. So text optically centres _low_. In a flex
   `items-center` row that mixes large text with a rule, the rule crosses
   _through_ the glyphs (boarding-pass `SFO ----- JFK` route line), and sibling
   prices ride above the title baseline (menu). Separately, a blanket
   `minSize.width = 0` hack collapses short text nodes in `justify-center` /
   `justify-between` rows so they **overlap** (boarding-pass stub renders
   `SFO◆JFK` mashed into `SFQJFK`).

2. **Tailwind support has silent drops.** Utilities that compile to valid CSS
   are dropped on the floor with no error, so designs render subtly wrong:
   `border-dashed` / `border-dotted` / `border-double` render **solid** (every
   "dotted" leader in menu/boarding/certificate is fake); CSS `linear-gradient`
   / `radial-gradient` backgrounds vanish; `text-shadow`,
   `background-size/position/repeat`, `display:inline-block`, `columns`, and
   `list-style` are ignored. The user's mandate: **fix everything that a static
   PDF can represent; defer only what is physically impossible** (runtime
   animation, hover/focus interactivity, scrolling, pixel/backdrop filters).

3. **No print-native size vocabulary.** The px→pt math is correct (`text-base` →
   12pt), but Tailwind's scale is screen-tuned, so the 15 templates are littered
   with raw `text-[6.5px]`, `tracking-[1.4pt]`. Authors must hand-compute
   points. There is no shipped preset mapping `text-xs … text-9xl` / `leading-*`
   / `tracking-*` to print-correct sizes.

Net effect: documents that look "like a web page at the wrong zoom" instead of
typeset print. This PRD fixes the engine, closes the Tailwind gaps, and ships a
print preset, then refactors the corpus to prove it.

## Mockups

- **Interface** - `null`. The user-visible surfaces are the 15 existing fixtures
  in `packages/fixtures/src/*/index.tsx`; they are fixed in place and verified
  by regenerating the node-cli PDF corpus and visually inspecting each rendered
  page (see AI checklist). No new standalone UI to mock.
- **Architecture** - `arch.md`. Shows the corrected text line-box (half-leading
  baseline), the min/max-content measurement contract, the new `ResolvedStyle`
  fields + their writer behaviour, and the proposed print `@theme` size scale.

## Context (self-contained)

Stack: pnpm + turbo monorepo. Tailwind v4 (Oxide) is compiled **at runtime**
from class strings collected off the rendered React tree, then
`packages/tailwind/src/css-to-styles.ts` parses the compiled CSS into a
`ResolvedStyle` (`packages/core/src/types.ts:25`). That feeds the Taffy WASM
layout (`packages/core/src/layout/taffy-adapter.ts`) and the pdf-lib writer
(`packages/core/src/writer/`). Fonts: standard PDF fonts
(Helvetica/Times/Courier via pdf-lib, WinAnsi) and custom fonts (fontkit +
HarfBuzz). Visual QA tool: `pdftoppm -png -r 110 file.pdf out` then view the
PNG.

Verification gates (repo-real): `pnpm lint` (biome), `pnpm typecheck` (turbo
tsc), `pnpm test` (turbo vitest),
`pnpm --filter @imprint-pdf/example-node-cli generate` (renders the whole corpus
to `examples/node-cli/out/`).

### Alignment - current code

`packages/core/src/typography/text.ts:112` `measureText` returns
`{ width, height, lineHeight, lines }` with `height = y` (a multiple of
`lineHeight`) and **no ascent/descent**. `lineHeight` is computed at
`text.ts:120-128`: unitless → `size * ratio`, px/pt → absolute, default
`size * 1.2`.

`packages/core/src/writer/drawText.ts:80`:

```ts
const lineY = pageHeight - (geo.y + geo.paddingTop + line.y + fontSize);
```

Baseline is `fontSize` below the box top - no leading distribution - so glyphs
sit optically low in the box.

`packages/core/src/layout/taffy-adapter.ts:254-262`:

```ts
// ...crush its children to zero height, so their text overlapped.
// ...Width stays 0: text columns must still be free to shrink and
// re-wrap to the space the row allots them (min-content auto would force the
s.minSize = {
  width: dim(style.minWidth, containerWidth, 0),
  height: dim(style.minHeight, containerWidth, 'auto'),
};
```

The leaf measure callback is at `taffy-adapter.ts:470-512`; for text it calls
`measureText(textNode.text, style, effectiveWidth, font)` but does **not**
branch on `availableSpace` being min-content vs max-content - so it cannot
report a proper intrinsic minimum, which is why the `width: 0` hack exists.

### Tailwind gaps - current code

`packages/tailwind/src/css-to-styles.ts` holds `PROP_MAP` (CSS property →
ResolvedStyle key, lines ~2-94). `border-style` is **absent** entirely, so it is
never parsed. Gradients reach `backgroundImage` only as `url()`; `drawNode`'s
`drawBackgroundImage` (`packages/core/src/writer/drawNode.ts:230-257`) handles
only `url()`. SVG gradient infrastructure already exists and is reusable:
`packages/core/src/writer/svg/gradients.ts` (PDF Type 2/3 shading dicts).
`ResolvedStyle` has `boxShadow?` and `backgroundImage?` (`types.ts:107-108`) but
no `borderStyle`, `textShadow`, `backgroundSize/Position/Repeat`,
`listStyleType`.

`packages/eslint/src/rules/no-unsupported-css.ts:4-44` lists prefixes/classes
flagged as unsupported - currently includes things this PRD will make supported.

### Print scale - current code

`packages/core/src/layout/units.ts:24`:
`UNIT_TO_PT = { pt: 1, mm: 2.8346, cm: 28.346, in: 72, px: 0.75 }`. The Tailwind
runner (`packages/tailwind/src/tw-runner.ts:32-41,161`) auto-discovers a
consumer CSS entry (`src/app.css`, …) and compiles `@import "tailwindcss"` + the
consumer's `@theme`. imprint ships **no** base theme today;
`examples/node-cli/src/app.css` only maps `--font-*`. There is therefore a clean
seam to ship an importable print preset stylesheet.

The 15 fixtures live in `packages/fixtures/src/<name>/index.tsx`; `invoice` is
the cleanest reference. All currently use raw `text-[Npx]` / `tracking-[Npt]`.

## Non-goals

- Runtime animation / `transition-*` / `animate-*` - impossible in static PDF.
- Interactive variants: `hover:`/`focus:`/`active:`/`group-*`/`peer-*` - no
  runtime state. These remain in the eslint unsupported list.
- `overflow: scroll/auto`, `scroll-*`, `snap-*` - no scrolling model.
- Pixel filters (`blur`, `brightness`, …) and `backdrop-*` - no compositing/
  raster filter model in pdf-lib. (SVG `<filter>` rasterization is a separate
  existing path, untouched here.)
- Changing the px→pt ratio or page-size tables - the math is correct; only the
  _theme scale_ is added.
- Redesigning template layouts - only fix alignment artifacts and swap raw sizes
  for the new tokens; do not re-art-direct.

## Instructions

Eight units. **A, B** (text/layout) are independent of **C-E** (writer) and of
**F** (preset). **G** (fixture retune) depends on **F** and benefits from A-E.
**H** (eslint) depends on C-E landing. Fan out A,B,C,D,E,F in parallel; do G and
H after their deps. Regenerate the corpus and re-inspect after each unit.

### Unit A - Text line-box / vertical metrics (alignment)

Goal: text optically centres against siblings; baseline uses CSS half-leading.

1. In `packages/core/src/typography/text.ts`, extend `TextMetrics` (and the
   per-line data if needed) to carry `ascent` and `descent` in points. Derive
   them from the font: for custom fonts use fontkit metrics (`unitsPerEm`,
   `ascent`, `descent`) already available via the `LoadedFont`; for standard
   fonts where exact metrics are unavailable, fall back to
   `ascent = 0.8 * size`, `descent = 0.2 * size`. Confirm the `LoadedFont` shape
   exposes what you need; if not, thread metrics through from
   `packages/core/src/typography/`.
2. Compute the half-leading line box:
   `leading = lineHeight - (ascent + descent)`;
   `baselineFromTop = ascent + leading / 2`. Allow negative leading
   (`leading-none`) without clamping glyphs out of the box.
3. In `packages/core/src/writer/drawText.ts:80`, replace `+ fontSize` in `lineY`
   with `+ baselineFromTop` for that line (use the metric from step 1/2, not a
   recomputation that can drift). The multi-line advance (`line.y`) stays
   `lineHeight`-based.
4. Expected end state: boarding-pass route rule passes through the **vertical
   centre gap** between `SFO`/`JFK`, not through the glyphs; menu prices share
   the dish-title baseline. Re-render and confirm visually.

### Unit B - Intrinsic text sizing (overlap)

Goal: short text reserves its min-content width; remove the `width:0` hack.

1. In `packages/core/src/layout/taffy-adapter.ts:470-512`, branch the leaf
   measure callback on `availableSpace.width`:
   - min-content → measure the **longest single unbreakable word** (call
     `measureText` with `containerWidth = 0`/`Infinity` semantics that yield the
     widest word; you may add a small helper in `text.ts` that returns
     `minContentWidth` = max word width and `maxContentWidth` = single-line
     width).
   - max-content → single-line width.
   - concrete width → current wrapping behaviour.
2. With a real min-content reported, change `taffy-adapter.ts:259` so text
   leaves no longer need the blanket `width: 0`. Keep `minHeight: auto` (it
   fixed vertical overflow overlap). For non-text nodes preserve existing
   behaviour. The goal is: a `justify-center` row of `SFO` / `◆` / `JFK`
   reserves each child's width and lays them out with the gaps, **no overlap**.
3. Regression guard: the resume two-column layout must not clip its right column
   (the original reason `width:0` was introduced). Verify `resume.pdf` visually
   and via any existing golden.
4. Expected end state: boarding-pass stub shows `SFO ◆ JFK` spaced; multi-word
   paragraphs still wrap and shrink normally.

### Unit C - border-style (dashed / dotted / double)

1. Add `borderStyle` and per-side `borderTopStyle` … `borderLeftStyle` to
   `ResolvedStyle` (`packages/core/src/types.ts`).
2. Add the `border-style` / `border-*-style` CSS properties to `PROP_MAP` in
   `packages/tailwind/src/css-to-styles.ts` so they resolve.
3. In `packages/core/src/writer/drawNode.ts` border-stroke drawing: apply a PDF
   dash pattern - `dashed` ≈ `[3*w, 3*w]`, `dotted` ≈ `[w, 2*w]` with round
   caps, `double` = two concentric strokes each `w/3` separated by `w/3`.
   Per-side styles must be honoured (a node can have one dotted side).
4. Expected end state: menu price leaders and boarding-pass route line render as
   **actual dotted/dashed** rules; certificate dashed inner frame is dashed.

### Unit D - CSS gradients (linear / radial backgrounds)

1. In `css-to-styles.ts`, keep `linear-gradient(...)` / `radial-gradient(...)`
   values on `backgroundImage` (do not drop them); add a parser that yields
   `{ kind, angle|shape, stops: [{color, offset}] }`.
2. In `drawNode.ts` `drawBackgroundImage` (`:230-257`), when the value is a
   gradient, build a PDF **axial (Type 2)** or **radial (Type 3)** shading dict.
   Reuse `packages/core/src/writer/svg/gradients.ts` - factor shared shading
   construction into a function both call rather than duplicating.
3. Honour the node's border-radius clip (gradients fill the rounded rect).
4. Expected end state: a `bg-[linear-gradient(...)]` / `bg-linear-to-r` element
   renders a smooth gradient. Add a small gradient case to a fixture (e.g. a
   cover band) to prove it in the corpus.

### Unit E - Remaining static drops

Implement each (all are statically representable):

1. `text-shadow` - add `textShadow` to `ResolvedStyle` + `PROP_MAP`; in
   `drawText.ts` draw the run once in the shadow colour at the offset, then the
   real run on top. Multiple shadows: back-to-front.
2. `background-size` / `background-position` / `background-repeat` for `url()`
   backgrounds - add fields + `PROP_MAP` entries; apply via the existing
   image-fit logic in `drawImage.ts` / `drawNode.ts` (cover/contain/center;
   `repeat` tiles).
3. `display: inline-block` - map to a shrink-to-fit leaf in `taffy-adapter.ts`
   (`flex: 0 0 auto`, width = max-content).
4. `list-style-type` / `list-style-position` - add fields + `PROP_MAP`; render
   `<li>` markers (`disc`, `decimal`, `none`, `inside`/`outside`) from the
   resolved value instead of any hardcoded marker.
5. `columns` / `column-count` - a Taffy container that splits children into N
   equal columns (use Taffy's grid/flex; if genuinely infeasible in Taffy, STOP
   and report rather than silently skipping).
6. Expected end state: each utility renders; add a focused unit test per feature
   in the nearest existing `*.test.ts` (e.g. `css-to-styles.test.ts`,
   `color.test.ts`).

### Unit F - Print `@theme` preset (size vocabulary)

1. Ship an importable stylesheet at `packages/react` (e.g.
   `packages/react/preset.css`) exported via the package `exports` map as
   `@imprint-pdf/react/preset.css`. It contains a Tailwind v4 `@theme` block
   redefining the font-size, line-height, letter-spacing scale to the
   print-native values in `arch.md` §4 (add a `text-2xs`; remap `xs…9xl`; tune
   default `leading-*` / `tracking-*`). Spacing stays default.
2. The preset must compose: consumer writes
   `@import "@imprint-pdf/react/preset.css";` then `@import "tailwindcss";` plus
   their own `--font-*`. Confirm the runtime tw-runner picks the values up (the
   runner already compiles the consumer entry; the preset is just upstream
   `@theme`).
3. Document it: a short section in the package README / a doc note showing the
   one-line import and a table of token → pt. (Do not edit any auto-generated
   file or CHANGELOG.)
4. Expected end state: in a doc using the preset, `text-base` → 9pt, `text-2xl`
   → 18pt, etc., matching `arch.md`. Add a `css-to-styles`/units test asserting
   a couple of token→pt resolutions through the preset.

### Unit G - Retune the 15 fixtures (depends on F; do after A-E)

1. Add `@import "@imprint-pdf/react/preset.css";` to
   `examples/node-cli/src/app.css` (above `@import "tailwindcss";`).
2. In every `packages/fixtures/src/<name>/index.tsx`, replace raw `text-[Npx]`
   with the nearest semantic token from the preset, and raw `tracking-[Npt]` /
   `leading-[…]` with the semantic utility where one fits. Keep arbitrary values
   only where no token is close (note each such case). Do **not** re-art-direct
   layouts.
3. Expected end state: the corpus renders at least as good as before with far
   fewer raw pixel literals; `grep -r "text-\[" packages/fixtures/src` is
   drastically reduced. Visually inspect all 15.

### Unit H - eslint no-unsupported-css (depends on C-E)

1. In `packages/eslint/src/rules/no-unsupported-css.ts`, remove from the
   unsupported lists everything this PRD now supports (border-style variants,
   gradients, text-shadow, the background-\* props, inline-block, columns,
   list-style). Keep the genuinely-impossible ones (animation, interactivity,
   scroll, filters, backdrop).
2. Update the rule's tests to match.
3. Expected end state: a template using `border-dashed` / `bg-linear-to-r` no
   longer lints as unsupported.

## STOP conditions

- A golden/visual test moves in a way you cannot explain as an intended fix -
  stop, show the diff, do not bless it.
- `columns`/`column-count` proves infeasible in the current Taffy binding - stop
  and report rather than silently dropping (Unit E.5).
- The text-metrics change (Unit A) shifts the baseline of the whole corpus
  noticeably (every doc moves) - expected to _improve_ centring, but if body
  text visibly regresses, stop and reconcile against the half-leading math in
  `arch.md` before pressing on.
- Any required change to fontkit metric plumbing turns out to need a new
  dependency or WASM rebuild - stop and report.
- Scope drifts toward redesigning template art direction - stop; that is a
  non-goal.

## AI verification checklist (automatable)

- [ ] `pnpm lint` - clean
- [ ] `pnpm typecheck` - 0 errors
- [ ] `pnpm test` - all packages pass (core, tailwind, react, fixtures, eslint)
- [ ] New/updated unit tests exist for: line-box ascent/descent (Unit A),
      min/max-content width (Unit B), border-style parse+draw (C), gradient
      parse (D), each Unit E feature, preset token→pt (F), eslint rule (H) - and
      pass.
- [ ] `pnpm --filter @imprint-pdf/example-node-cli generate` - all 15 PDFs
      render without error.
- [ ] `grep -rn "text-\[" packages/fixtures/src | wc -l` is far lower than the
      pre-PRD count (raw pixel literals replaced by tokens).
- [ ] Render each of the 15 PDFs with `pdftoppm -png -r 110` and confirm: no
      overlapping text, no rule crossing through glyphs, dotted/dashed borders
      actually dotted/dashed, any gradient renders smoothly.

## Human verification checklist (judgment calls)

- [ ] Alignment reads correctly end to end: boarding-pass route line + stub,
      menu price leaders, every doc's flex `items-center` rows look optically
      centred.
- [ ] The print size scale (`arch.md` §4) _feels_ right for print - body,
      captions, and display sizes are well-proportioned, not screen-sized.
- [ ] Dotted/dashed/double borders and gradients look intentional, not buggy.
- [ ] No subtle baseline regression in dense body copy (contract, report,
      tax-form) that a unit test would miss.
- [ ] The one-line preset import is the DX we want; token names read naturally.

## Execution notes (post-implementation)

Recorded during EXECUTE so the diff reads honestly against the plan.

- **Unit B - real root cause was dropped logical margins, not min-content.**
  Geometry probing showed the boarding-pass "overlap" was `margin-inline` /
  `margin-block` (every `mx-*` / `my-*`, including `mx-auto`) being silently
  dropped by `css-to-styles` - `padding-inline/block` were mapped but the margin
  equivalents were not. Fixed by adding them to `PROP_MAP` + the fan-out. The
  planned Taffy/WASM min-content rebuild was therefore **not** needed: with
  margins applied, no real text overlap remains and the resume two-column layout
  (the reason the `width:0` hack exists) still works. WASM left untouched.

- **Bonus engine fix - arbitrary-value selector regex.** The rule selector regex
  in `css-to-styles` did not allow `(`, `)`, `,` (etc.), so EVERY arbitrary
  class whose escaped selector contained them - `bg-[linear-gradient(...)]`,
  `w-[calc(...)]`, `grid-cols-[repeat(...)]` - was skipped and its declarations
  silently dropped. Broadened the character class. This was the actual blocker
  for Unit D and fixes a whole category of arbitrary utilities.

- **Unit D - gradients.** CSS `linear-gradient` / `radial-gradient` backgrounds
  render via PDF shading dicts painted with the `sh` operator inside a clip
  (`packages/core/src/writer/css-gradient.ts`). Covers raw/arbitrary gradient
  values + angle/keyword directions + multi-stop. Known bounds: the clip is the
  element's rectangle (rounded corners not yet clipped); the Tailwind
  `from-/via-/to-` utility sugar (oklab + `--tw-gradient-*` cross-class vars) is
  not wired - raw gradients only.

- **Unit E - scoped honestly.** `text-shadow` implemented (layered offset draw;
  PDF has no blur). `inline-block`, `columns`, and `list-style` were NOT
  stubbed: imprint has no inline flow, no column fragmentation, and no list-item
  nodes, so each needs a real architectural feature and none of the 15 templates
  use them. Recommended as their own follow-up PRDs rather than
  half-implementations. `background-size/position/repeat` apply only to `url()`
  backgrounds (also unused) and were left for the same reason.

- **Pre-existing failure (not 005).** `packages/e2e` `standalone-build.test.ts`
  fails at `next build` ("Failed to collect page data") - a harfbuzz top-level-
  await bundling issue that also breaks the remix/next example builds on the
  base branch. Untouched by this PRD. The flawed `space-between` glyph-position
  assertion in `flex-and-grid.test.tsx` was made deterministic (fixed-width
  items) since it surfaced during verification.
