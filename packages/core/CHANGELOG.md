# Changelog

## 1.0.0

### Minor Changes

- [`463661d`](https://github.com/tamimbinhakim/imprint-pdf/commit/463661d5ed6788ebfa6fe82066c6c22c79a6c584)
  Thanks [@tamimbinhakim](https://github.com/tamimbinhakim)! - Three fixes in
  `@imprint-pdf/core`'s render pipeline and one schema expansion.

  **`<PageNumber>` / `<TotalPages>` now actually resolve.** Previously the
  components emitted an `imprint-view` carrying `__pageNumber: true` /
  `__totalPages: true` flags that nothing in the writer ever read — so they
  always rendered as empty boxes. The `applyImprintVariants` pass now
  substitutes a text node with the correct value per page (it already cloned
  each page subtree). A new `substitutePageMarkers(node, pageIndex, pageCount)`
  helper re-clones running header / footer / watermark templates per page in the
  writer, since those are authored once and drawn on every page. The two
  components default to `display: 'inline-flex'` so they don't break the flow
  when used inline.

  **SVG fail-soft.** A malformed inline SVG (unusual `transform`, weird
  `viewBox`, partially-broken gradient) used to throw out of `drawSvgString`
  mid-emission, corrupting the page content stream and leaving the rest of the
  page blank. `drawShape` now wraps each shape in `try/finally` so its `q/Q`
  graphics-state pair always balances; `drawSvgString` catches any remaining
  throw and warns. Zero-area viewBoxes (`viewBox="0 0 0 0"`) are caught up front
  instead of producing a NaN CTM. A single bad SVG no longer nukes the whole
  page.

  **`defineConfig` schema drift.** The Zod schema now accepts every block the
  docs already mention: `tailwind.{runtimeFallback,safelist,content}`,
  `typography.{lineBreaking,hyphenation,defaultWidows,defaultOrphans,subset}`,
  `output.{intent,outputIntent,compress,version}`, `assets.{baseUrl,cacheDir}`,
  and `FontDeclaration.{variable,axes}`. Previously these fields were documented
  but silently dropped by `parseConfig`.

  **WOFF2 RangeError detection.** When `@pdf-lib/fontkit@1.1.1`'s WOFF2 decoder
  throws `RangeError: Index out of range` on a pre-subsetted file (notably Bunny
  Fonts' Outfit family), `loadCustomFont` now emits a targeted warning pointing
  at `docs/guides/fonts.md` and suggests switching to the TTF variant.
  Previously the error string was identical to the unrelated buffer-aliasing bug
  fixed in `52570c9`, making it hard to diagnose.

### Patch Changes

- [`52570c9`](https://github.com/tamimbinhakim/imprint-pdf/commit/52570c9d8b08ae68e1cb9d81a2fe7cebe3e37a5f)
  Thanks [@tamimbinhakim](https://github.com/tamimbinhakim)! - Fix
  `RangeError: Index out of range` when loading fonts via Node's `fs.readFile`.

  `readFile` returns a Buffer that is typically a view into Node's allocation
  pool — `buf.buffer` is the whole pool, frequently many KB larger than the
  file. The asset resolver wrapped this in a `Uint8Array` view that preserved
  `byteOffset`/`byteLength` correctly, but `createHbFont` passed `.buffer`
  straight to HarfBuzz. HarfBuzz parses the entire ArrayBuffer it's handed,
  walked past the font's end into pool padding, and threw
  `RangeError: Index out of range`, which uncaughtException'd the render.

  Two defensive fixes:
  - `createAssetResolver().resolve(filePath)` now copies the file's bytes into a
    fresh, tight `Uint8Array`. Downstream WASM consumers can trust
    `bytes.buffer.byteLength === bytes.byteLength`.
  - `createHbFont(bytes)` detects non-tight views and copies to a fresh
    `ArrayBuffer` before handing it to HarfBuzz. Defends against third-party
    `AssetResolver` implementations that return pool-backed bytes.

  Symptom in the wild: registering any locally-resolved `.woff2` / `.ttf` font
  in `imprint.config.ts` from a Node runtime (`renderToServer`,
  `renderToBuffer`, Next.js route handlers) would hang the render and surface an
  `uncaughtException`. Hosted URLs were unaffected because
  `Response.arrayBuffer()` already returns a tight buffer.

All notable changes are documented here. See
[Conventional Commits](https://www.conventionalcommits.org) and
[Changesets](../../.changeset) for the release workflow.
