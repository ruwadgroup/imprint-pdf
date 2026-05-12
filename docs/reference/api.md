# API reference

Typed exports per package.

## `@imprint-pdf/core`

### Runtime

- `createAssetResolver(options)` → `AssetResolver` Build a resolver from `fetch`
  / `fs` / custom handlers.

### Config

- `defineConfig(config)` → config _(type-preserving)_

### Hashing

- `hash(input, length?)` → `string` — SHA-256 hex.
- `shortHash(input)` → `string` — 12-char prefix.

### Types

`DocumentNode`, `PageNode`, `ViewNode`, `TextNode`, `ImageNode`, `SvgNode`,
`FormNode`, `TextFieldNode`, `CheckboxNode`, `RadioGroupNode`, `DropdownNode`,
`SignatureNode`, `ButtonNode`, `ChartNode`, `PageBreakNode`.

`PdfNode` — union of all node types.

`ResolvedStyle`, `ComputedGeometry`, `FontDeclaration`, `AssetResolver`,
`ImprintConfig`, `ImprintConfigInput`, `RenderOptions`.

## `@imprint-pdf/react`

### `pdf()` — the unified entry point

```ts
pdf(element: ReactElement, options?: PdfOptions & { as?: 'response' }): Promise<Response>
pdf(element: ReactElement, options: PdfOptions & { as: 'bytes' }): Promise<Uint8Array>
pdf(element: ReactElement, options: PdfOptions & { as: 'stream' }): Promise<ReadableStream<Uint8Array>>
```

`PdfOptions` extends `RenderOptions` with:

- `as?: 'response' | 'bytes' | 'stream'` — output shape (default `'response'`).
- `filename?: string` — `Content-Disposition` filename (response only, default
  `'document.pdf'`).
- `disposition?: 'inline' | 'attachment'` — default `'inline'`.

Auto-loads `imprint.config.ts` from the project root and merges caller options
on top. Overloads narrow the return type by the literal value of `as`.

```ts
// Most common — Next.js route handler returning a Response:
export const GET = () => pdf(<Invoice />);

// Power-user escape hatches:
const bytes = await pdf(<Doc />, { as: 'bytes' });
const stream = await pdf(<Doc />, { as: 'stream' });
```

### Components

`Document`, `Page`, `View`, `Text`, `Image`, `Svg`, `Link`, `Bullet`,
`PageNumber`, `TotalPages`, `Form`, `TextField`, `Checkbox`, `RadioGroup`,
`Dropdown`, `Signature`, `Button`, `Chart`.

### `@imprint-pdf/react/standalone`

Self-contained build for v8-isolate runtimes (Cloudflare Workers, Vercel Edge,
Bun). Same `pdf()` surface as the main entry; additionally accepts an optional
pre-compiled `WebAssembly.Module` so hosts can avoid re-instantiating per
request.

```ts
pdf(element, options?: PdfOptions & { wasm?: WebAssembly.Module }): Promise<Response | Uint8Array | ReadableStream<Uint8Array>>
```

## `@imprint-pdf/next`

```ts
pdf(element: ReactElement, options?: PdfOptions): Promise<Response | Uint8Array | ReadableStream<Uint8Array>>
```

Same overloads as `@imprint-pdf/react`'s `pdf()`. Auto-detects edge vs Node via
`NEXT_RUNTIME === 'edge'` / `globalThis.EdgeRuntime` and dispatches to the
matching `@imprint-pdf/react` build.

### `@imprint-pdf/next/plugin`

```ts
withImprint(options?: ImprintPluginOptions): (nextConfig: NextConfig) => NextConfig
```

## `@imprint-pdf/vite`

```ts
imprint(options?: ImprintViteOptions): Plugin[]
```

Composite plugin — bundles the Tailwind class extractor, virtual font modules,
and `.pdf.tsx` HMR. Drop it into your `vite.config.ts`'s `plugins:` array.

## `@imprint-pdf/print`

```ts
// Import side-effect registers the print writer
import '@imprint-pdf/print';
```

New `<Document>` props: `intent`, `outputIntent`. New `<Page>` props: `bleed`,
`marks`. New Tailwind variants: `imprint:cmyk-[…]`, `imprint:spot-[…]`,
`imprint:overprint`.

## `@imprint-pdf/sign`

```ts
import '@imprint-pdf/sign';

signBuffer(
  pdf: Uint8Array,
  options: SignOptions
): Promise<Uint8Array>
```

`SignOptions`:
`{ certificate: string; privateKey: string; reason?: string; location?: string; tsaUrl?: string }`.

## `@imprint-pdf/ua`

```ts
// Import side-effect registers the tagged-PDF writer
import '@imprint-pdf/ua';
```

Enables the PDF/UA-1 structure tree, marked content, alt text, and language
propagation. No new public API — all via JSX props (`alt`, `aria-label`,
`lang`).

## `@imprint-pdf/eslint`

```js
import imprint from '@imprint-pdf/eslint';
// imprint.configs.recommended
// imprint.rules['no-unsupported-css']
// imprint.rules['no-missing-alt']
// imprint.rules['no-dynamic-class-without-safelist']
// imprint.rules['no-hover-variants']
// imprint.rules['require-page-in-document']
// imprint.rules['no-xfa-forms']
```
