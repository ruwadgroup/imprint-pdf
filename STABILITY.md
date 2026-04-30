# Stability

This document defines what's covered by semantic versioning, what's explicitly
mutable, and what we promise about upgrades.

## Status

**Pre-1.0.** Until `@imprint/core` reaches `1.0.0`, breaking changes can land in
any minor release. Pin exact versions if your project can't tolerate surprises.

`0.x.y` ranges:

- `0.x` minor bumps may break the public API. Read the changeset.
- `0.x.y` patch bumps are non-breaking — bug fixes, perf, doc edits.

Once 1.0.0 lands, semver applies strictly. Major bumps for breaking changes;
minor for additive features; patch for fixes.

## Public API

Anything exported from a package's main entry or a documented sub-path is part
of the public surface.

| Package                     | Public surface                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@imprint/core`             | `PdfNode*`, `LayoutNode*`, `Style*`, `Length`, `Color`, `AssetResolver`, `defineComponent`, type-only exports of the IR                                                                                                                                                                                                                                                                        |
| `@imprint/core/config`      | `defineConfig`, `parseConfig`, `safeParseConfig`, `ImprintConfig`, `ImprintConfigInput`                                                                                                                                                                                                                                                                                                        |
| `@imprint/core/units`       | `mm`, `in`, `pt`, `pc`, `cm`, `parseLength`, `toPdfPt`                                                                                                                                                                                                                                                                                                                                         |
| `@imprint/react`            | `<Document>`, `<Page>`, `<Image>`, `<Svg>`, `<Chart>`, `<Link>`, `<Header>`, `<Footer>`, `<Watermark>`, `<Bookmark>`, `<PageNumber>`, `<TotalPages>`, `<Form>`, `<TextField>`, `<Checkbox>`, `<RadioGroup>`, `<Dropdown>`, `<Button>`, `<Signature>`, `renderToBuffer`, `renderToStream`. HTML elements (`<div>`, `<span>`, `<p>`, `<h1>`–`<h6>`, `<a>`, `<img>`, `<table>` …) are first-class |
| `@imprint/react/standalone` | `renderToStream`, `renderToBuffer` (edge-runtime build accepting injected WASM)                                                                                                                                                                                                                                                                                                                |
| `@imprint/tailwind`         | Vite / Webpack / Bun plugin factory, `imprintTailwindPreset`                                                                                                                                                                                                                                                                                                                                   |
| `@imprint/tailwind/runtime` | `resolveClasses`, `withRuntimeOxide`                                                                                                                                                                                                                                                                                                                                                           |
| `@imprint/cli`              | `loadConfig`, `init`, `render`, `dev`, `validate`                                                                                                                                                                                                                                                                                                                                              |
| `@imprint/next`             | `withImprint`, `createPdfRoute`, `getRequestLocale`                                                                                                                                                                                                                                                                                                                                            |
| `@imprint/vite`             | default plugin export, `ImprintVitePluginOptions`                                                                                                                                                                                                                                                                                                                                              |
| `@imprint/eslint-plugin`    | default plugin export, rules and configs                                                                                                                                                                                                                                                                                                                                                       |
| `@imprint/print` (BSL)      | `withPrintIntent`, `cmyk`, `spot`, `OutputIntent`, `IccProfile`                                                                                                                                                                                                                                                                                                                                |
| `@imprint/sign` (BSL)       | `signDetached`, `Pkcs7Options`                                                                                                                                                                                                                                                                                                                                                                 |
| `@imprint/ua` (BSL)         | `tag`, `<TagP>`, `<TagH>`, `<TagFigure>`, `<Lang>`, structure-tree helpers                                                                                                                                                                                                                                                                                                                     |

## Explicitly internal

Anything under `@imprint/core/internal` or `@imprint/<pkg>/internal` is **not**
part of the public surface, even pre-1.0. Workspace packages depend on it;
external code shouldn't.

If you reference these and they break, that's expected.

## Output format

The PDF byte stream produced by `@imprint/core` is **not** part of the contract
— we may swap pdf-lib for `imprint-pdf` (Rust → WASM) at the v1 boundary, and
the byte-level layout will differ. The PDF will remain **valid** and conform to
the same standards (PDF 1.7 default, PDF 2.0 opt-in; PDF/X-4 and PDF/UA-1 in
`@imprint/print` and `@imprint/ua`), but byte-for-byte stability is not
guaranteed.

What is contractual:

- **PDF version** — declared in config, honored by the writer.
- **Page metrics** — A4, US Letter, custom — exact pt dimensions.
- **Font subsetting** — embedded subsets contain every glyph used.
- **Tagged PDF tree** — semantic role mapping is stable across patches (additive
  only).
- **AcroForm field names** — derived from JSX `name` props verbatim.

## WASM modules

The set of WASM modules and their loading patterns are part of the contract. We
commit to:

- The `standalone` build pattern (WASM exported as bytes, app instantiates)
  stays compatible across patch and minor bumps pre-1.0.
- WASM module size grows by no more than 25% within a minor bump without a
  changeset call-out.
- Custom `AssetResolver` implementations don't break across patches.

## Tailwind plugin

`@imprint/tailwind` is pinned to a Tailwind major version. Tailwind v4 support
stays compatible across imprint minor releases. A Tailwind v5 adapter ships as a
separate subpath when v5 lands; the v4 build remains maintained for at least 12
months after.

## Provider signatures

The `@imprint/print` ICC profile bundle is keyed by a profile signature
(typically the profile's `mlucDescription`). We commit to:

- Built-in profile signatures change only when their behavior changes (different
  rendering intent, updated FOGRA / GRACoL bundle).
- Cache invalidation when this happens is deliberate and called out in the
  changeset.

## What's allowed to break in any pre-1.0 release

- The `/internal` sub-path of any package.
- Naming and organisation of cookbook recipes (URLs may move).
- Default values of optional config fields (e.g. `concurrency` could rise from 8
  to 16).
- The exact CSS produced by `@imprint/tailwind` for a given class (Tailwind
  itself can change it).
- Performance characteristics — we may swap algorithms.

## What we won't break in a pre-1.0 release without an opt-in

- The `<Document>` / `<Page>` call signatures.
- HTML element aliases (`<div>`, `<p>`, `<h1>`…) and their semantic tagging.
- `renderToBuffer` / `renderToStream` / `renderToFile` signatures.
- Existing config field shapes (additive evolution only).

## Reporting

If something is unclear or you think we've broken a stable surface,
[open an issue](https://github.com/tamimbinhakim/imprint/issues/new). Pre-1.0 we
treat reasonable surface confusions as bugs to fix in docs.
