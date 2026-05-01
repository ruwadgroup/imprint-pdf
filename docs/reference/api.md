# API reference

Typed exports per package.

## `@imprint/core`

### Runtime

- `createAssetResolver(options)` → `AssetResolver`  
  Build a resolver from `fetch` / `fs` / custom handlers.

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

## `@imprint/react`

### Render functions

```ts
renderToBuffer(element: ReactElement, options?: RenderOptions): Promise<Uint8Array>
renderToStream(element: ReactElement, options?: RenderOptions): Promise<ReadableStream<Uint8Array>>
```

### Components

`Document`, `Page`, `View`, `Text`, `Image`, `Svg`, `Link`, `Bullet`,
`PageNumber`, `TotalPages`, `Form`, `TextField`, `Checkbox`, `RadioGroup`,
`Dropdown`, `Signature`, `Button`, `Chart`.

### `@imprint/react/server`

```ts
renderToServer(element: ReactElement, options?: RenderOptions): Promise<Uint8Array>
```

### `@imprint/react/standalone`

```ts
renderToStream(
  element: ReactElement,
  options: RenderOptions & { wasm: WebAssembly.Module }
): Promise<ReadableStream<Uint8Array>>
```

## `@imprint/next`

```ts
renderToServer(element: ReactElement, options?: RenderOptions): Promise<Uint8Array>
renderToEdge(element: ReactElement, options?: RenderOptions & { wasm?: WebAssembly.Module }): Promise<ReadableStream<Uint8Array>>
getImprintConfig(): Promise<ImprintConfig>
```

### `@imprint/next/plugin`

```ts
withImprint(options?: ImprintPluginOptions): (nextConfig: NextConfig) => NextConfig
```

## `@imprint/tailwind`

### `@imprint/tailwind/vite`

```ts
imprintTailwind(options?: ImprintTailwindOptions): Plugin
```

### `@imprint/tailwind/webpack`

```ts
withImprintTailwind(options?: ImprintTailwindOptions): (config: WebpackConfig) => WebpackConfig
```

## `@imprint/print` (Enterprise, BSL)

```ts
// Import side-effect registers the print writer
import '@imprint/print';
```

New `<Document>` props: `intent`, `outputIntent`.  
New `<Page>` props: `bleed`, `marks`.  
New Tailwind variants: `imprint:cmyk-[…]`, `imprint:spot-[…]`,
`imprint:overprint`.

## `@imprint/sign` (Enterprise, BSL)

```ts
import '@imprint/sign';

signBuffer(
  pdf: Uint8Array,
  options: SignOptions
): Promise<Uint8Array>
```

`SignOptions`:
`{ certificate: string; privateKey: string; reason?: string; location?: string; tsaUrl?: string }`.

## `@imprint/ua` (Enterprise, BSL)

```ts
// Import side-effect registers the tagged-PDF writer
import '@imprint/ua';
```

Enables the PDF/UA-1 structure tree, marked content, alt text, and language
propagation. No new public API — all via JSX props (`alt`, `aria-label`,
`lang`).

## `@imprint/eslint`

```js
import imprint from '@imprint/eslint';
// imprint.configs.recommended
// imprint.rules['no-unsupported-css']
// imprint.rules['no-missing-alt']
// imprint.rules['no-dynamic-class-without-safelist']
// imprint.rules['no-hover-variants']
// imprint.rules['require-page-in-document']
// imprint.rules['no-xfa-forms']
```
