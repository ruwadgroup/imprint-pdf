# Glossary

Project-specific terms, in one place.

## `pdf()`

The unified render entry point. Exported from `@imprint-pdf/react`,
`@imprint-pdf/react/standalone`, and `@imprint-pdf/next`. Signature:

```ts
pdf(element: ReactElement, options?: PdfOptions): Promise<Response | Uint8Array | ReadableStream<Uint8Array>>
```

Overloads narrow the return type by the literal value of `options.as`:
`'response'` (default) → `Response`, `'bytes'` → `Uint8Array`, `'stream'` →
`ReadableStream<Uint8Array>`.

## `PdfNode`

The intermediate representation between the React reconciler and the layout
engine. Every JSX element you write becomes a `PdfNode` in a tree. Concrete
subtypes: `DocumentNode`, `PageNode`, `ViewNode`, `TextNode`, `ImageNode`,
`SvgNode`, `LinkNode`, `FormNode`, `TextFieldNode`, `CheckboxNode`,
`RadioGroupNode`, `DropdownNode`, `SignatureNode`, `ButtonNode`, `ChartNode`,
`PageBreakNode`, `HeaderNode`, `FooterNode`, `WatermarkNode`, `BookmarkNode`.
Imported from `@imprint-pdf/core`.

## `imprint.config.ts`

Project config at the repo root. Defines fonts, Tailwind path, typography
defaults, output intent, and asset resolution. Loaded automatically by `pdf()`.
Created and validated via `defineConfig(...)` from `@imprint-pdf/core/config`.

## `defineConfig`

The type-preserving config helper. Returns the input type (not a widened union),
so IDE autocomplete works on every field.

```ts
import { defineConfig } from '@imprint-pdf/core/config';
export default defineConfig({
  /* … */
});
```

## `AssetResolver`

Single seam for all I/O — fonts, images, ICC profiles. Swap it to run
identically across Node (`fs` + `fetch`), Bun, the browser, and Cloudflare
Workers (`fetch` only). Built-ins: `createAssetResolver()`.

## `withImprint`

The Next.js config wrapper from `@imprint-pdf/next/plugin`. Adds the webpack
tailwind extraction plugin, the WASM experiment flags, and
`serverExternalPackages` entries.

```ts
import { withImprint } from '@imprint-pdf/next/plugin';
export default withImprint()(nextConfig);
```

## `imprint()` (Vite plugin)

The Vite plugin factory from `@imprint-pdf/vite`. Returns an array of plugins
covering Tailwind class extraction, virtual font modules, and `.pdf.tsx` HMR.

```ts
import { imprint } from '@imprint-pdf/vite';
export default defineConfig({ plugins: [imprint()] });
```

## `@imprint-pdf/react/standalone`

The edge-friendly build of `@imprint-pdf/react`. Used on Cloudflare Workers,
Vercel Edge, and Bun (where you import WASM as a static asset). Same `pdf()`
surface; additionally accepts `{ wasm: WebAssembly.Module }` in options so hosts
can avoid re-instantiating the renderer per request.

## `@imprint-pdf/react/preset`

A Tailwind CSS preset that registers imprint's custom variants (`page-first:`,
`page-left:`, `page-right:`). Import from your `app.css`:

```css
@import 'tailwindcss';
@import '@imprint-pdf/react/preset';
```

## Page variants (`page-first:`, `page-left:`, `page-right:`)

Tailwind variants that apply only on certain pages. `page-first` matches the
first page of the document; `page-left` and `page-right` match even/odd
(verso/recto) pages.

## `<PageNumber>` / `<TotalPages>`

JSX components that resolve to the current page index and total page count at
draw time. Lay out as `inline-flex` so they work as siblings of text:

```tsx
<span>
  Page <PageNumber /> of <TotalPages />
</span>
```

## `<Header>` / `<Footer>` / `<Watermark>` (running elements)

Children of `<Document>` that get drawn on every page. Re-laid-out per page (so
`<PageNumber>` inside them resolves correctly) and stamped above (`<Header>` /
`<Footer>`) or below (`<Watermark>`) the page content.

## PdfPostProcessHook

A hook function passed via `options.postProcess` that mutates the in-flight
`PDFDocument` before serialization. Used by `@imprint-pdf/print` (output
intents, marks, page boxes) and `@imprint-pdf/ua` (structure tree).

```ts
type PdfPostProcessHook = (ctx: PdfPostProcessContext) => Promise<void> | void;
```

## PdfPostBytesHook

A hook function passed via `options.postBytes` that mutates the serialized PDF
byte buffer. Used by `@imprint-pdf/sign` for PKCS#7 detached signatures.

```ts
type PdfPostBytesHook = (bytes: Uint8Array) => Promise<Uint8Array> | Uint8Array;
```

## Tailwind dispatch

imprint-pdf supports both Tailwind v3 (PostCSS plugin) and Tailwind v4 (Oxide
compiler). It auto-detects which version the consumer has installed by reading
`tailwindcss/package.json`. Precedence:

1. Explicit `tailwind.config` in `imprint.config.ts` → v3
2. Explicit `tailwind.stylesheet` in `imprint.config.ts` → v4
3. Auto-detected `tailwind.config.{ts,js,mjs,cjs}` + installed `tailwindcss@3` →
   v3
4. Auto-detected stylesheet → v4

## Trusted Publishing

npm's OIDC-based release mechanism. The Release workflow at
`.github/workflows/release.yml` mints an OIDC token; npm validates the token's
claims against per-package Trusted Publisher rows configured at
`https://www.npmjs.com/package/<name>/access`. No long-lived `NPM_TOKEN`
required.

## ImprintWebpackPlugin

Webpack plugin that scans source files for Tailwind classes at compile time and
emits an `imprint-classes.js` asset with the resolved style map. Used internally
by `withImprint()`'s webpack branch.

## ImprintTailwindOptions

Options object accepted by both the Vite and Webpack plugins, and by
`runTailwind` at render time:

```ts
interface ImprintTailwindOptions {
  config?: string; // Tailwind v3 JS config path
  stylesheet?: string; // Tailwind v4 CSS entry path
  safelist?: string[]; // classes to always include
  content?: string[]; // extra source globs to scan
}
```

## Knuth–Plass

The dynamic-programming line-breaking algorithm imprint-pdf uses by default.
Globally optimal paragraph breaks — measurably better than greedy on justified
text. The same algorithm TeX and InDesign use.

## Plass page breaking

The page-level companion to Knuth–Plass paragraph breaking. Minimises widows
(isolated last lines at the top of a page) and orphans (isolated first lines at
the bottom). Two-pass.

## Taffy

The Rust layout engine imprint-pdf compiles to WASM. Block + Flexbox + CSS Grid.
Powers Bevy, Dioxus, and Zed.

## HarfBuzz

The OpenType shaping engine. Handles kerning, ligatures, contextual alternates,
complex script shaping (Arabic, Devanagari, Thai, CJK), GSUB/GPOS tables, and
variable font axes. imprint-pdf uses the `harfbuzzjs` WASM build.

## ICU4X

The Unicode internationalization library. imprint-pdf uses it for segmentation
(UAX #29), bidirectional text (UAX #9), and line-break opportunities (UAX #14).
