# Changelog

All notable changes are documented here. See [Conventional Commits](https://www.conventionalcommits.org) and [Changesets](../../.changeset) for the release workflow.

## 1.0.0-alpha.3

### Minor

- **`<PageNumber>` / `<TotalPages>` now actually resolve.** Previously the components emitted a `view` carrying flags that nothing in the writer read. The `applyImprintVariants` pass now substitutes a text node with the correct value per page (it already cloned each page subtree). A new `substitutePageMarkers(node, pageIndex, pageCount)` helper re-clones running header / footer / watermark templates per page in the writer.
- **SVG fail-soft.** A malformed inline SVG used to throw out of `drawSvgString` mid-emission, corrupting the page content stream and leaving the rest blank. `drawShape` now wraps each shape in `try/finally` so its `q/Q` graphics-state pair always balances; `drawSvgString` catches any remaining throw and warns. Zero-area viewBoxes are caught up front. A single bad SVG no longer nukes the whole page.
- **`defineConfig` schema expanded** to match the docs: `tailwind.{runtimeFallback,safelist,content}`, `typography.{lineBreaking,hyphenation,defaultWidows,defaultOrphans,subset}`, `output.{intent,outputIntent,compress,version}`, `assets.{baseUrl,cacheDir}`, and `FontDeclaration.{variable,axes}`. Previously these fields were documented but silently dropped by `parseConfig`.

### Patch

- **WOFF2 `RangeError` detection.** When `@pdf-lib/fontkit@1.1.1`'s WOFF2 decoder throws `RangeError: Index out of range` on a pre-subsetted file (notably Bunny Fonts' Outfit family), `loadCustomFont` now emits a targeted warning pointing at the TTF workaround. Previously the error string was identical to an unrelated buffer-aliasing bug, making it hard to diagnose.
- **Font byte aliasing fix.** `createAssetResolver().resolve(filePath)` now copies the file's bytes into a tight `Uint8Array` so downstream WASM consumers (HarfBuzz, fontkit) can trust `bytes.buffer.byteLength === bytes.byteLength`. `createHbFont` also detects non-tight views as a second line of defence. Symptom in the wild: registering any locally-resolved `.woff2` / `.ttf` font in `imprint.config.ts` from Node would hang the render with an `uncaughtException`.
