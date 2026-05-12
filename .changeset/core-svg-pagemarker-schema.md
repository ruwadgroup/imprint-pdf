---
'@imprint-pdf/core': minor
'@imprint-pdf/react': patch
---

Three fixes in `@imprint-pdf/core`'s render pipeline and one schema expansion.

**`<PageNumber>` / `<TotalPages>` now actually resolve.** Previously the
components emitted an `imprint-view` carrying `__pageNumber: true` /
`__totalPages: true` flags that nothing in the writer ever read — so they always
rendered as empty boxes. The `applyImprintVariants` pass now substitutes a text
node with the correct value per page (it already cloned each page subtree). A
new `substitutePageMarkers(node, pageIndex, pageCount)` helper re-clones running
header / footer / watermark templates per page in the writer, since those are
authored once and drawn on every page. The two components default to
`display: 'inline-flex'` so they don't break the flow when used inline.

**SVG fail-soft.** A malformed inline SVG (unusual `transform`, weird `viewBox`,
partially-broken gradient) used to throw out of `drawSvgString` mid-emission,
corrupting the page content stream and leaving the rest of the page blank.
`drawShape` now wraps each shape in `try/finally` so its `q/Q` graphics-state
pair always balances; `drawSvgString` catches any remaining throw and warns.
Zero-area viewBoxes (`viewBox="0 0 0 0"`) are caught up front instead of
producing a NaN CTM. A single bad SVG no longer nukes the whole page.

**`defineConfig` schema drift.** The Zod schema now accepts every block the docs
already mention: `tailwind.{runtimeFallback,safelist,content}`,
`typography.{lineBreaking,hyphenation,defaultWidows,defaultOrphans,subset}`,
`output.{intent,outputIntent,compress,version}`, `assets.{baseUrl,cacheDir}`,
and `FontDeclaration.{variable,axes}`. Previously these fields were documented
but silently dropped by `parseConfig`.

**WOFF2 RangeError detection.** When `@pdf-lib/fontkit@1.1.1`'s WOFF2 decoder
throws `RangeError: Index out of range` on a pre-subsetted file (notably Bunny
Fonts' Outfit family), `loadCustomFont` now emits a targeted warning pointing at
`docs/guides/fonts.md` and suggests switching to the TTF variant. Previously the
error string was identical to the unrelated buffer-aliasing bug fixed in
`52570c9`, making it hard to diagnose.
