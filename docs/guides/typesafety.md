# Type safety

Imprint's JSX surface is fully typed. Every component prop is typed. Nothing
accepts `any` where a specific type is expected.

## Component props

All components ship strict TypeScript types:

```tsx
// TypeScript error — 'invalid' is not a valid size
<Page size="invalid" />

// TypeScript error — bleed requires @imprint/print
// (surfaced via a branded type on the prop)
<Page bleed="3mm" />
```

## `defineConfig` is type-preserving

The `defineConfig` helper from `@imprint/core/config` returns the input type,
not a widened `AutotranslateConfig`. Your IDE autocompletes every field.

```ts
// ✓ Autocompletes; errors on unknown fields
export default defineConfig({
  fonts: [{ family: 'Inter', src: './fonts/Inter.woff2' }],
  tailwind: { config: './tailwind.config.ts' },
  typography: {
    hyphenation: { en: true },
  },
});
```

## Render function types

```ts
// renderToBuffer accepts a React element typed to Imprint's JSX namespace
const pdf = await renderToBuffer(<Invoice data={data} />);
//    ^ Uint8Array

// renderToStream returns ReadableStream<Uint8Array>
const stream = await renderToStream(<Invoice data={data} />, { wasm });
//    ^ ReadableStream<Uint8Array>
```

## JSX namespace

Imprint registers its own JSX namespace for the `className`-bearing document
components. Applying `className` to a `<Page>` from a different namespace
would be a type error.

```ts
// tsconfig.json
{
  "compilerOptions": {
    "jsxImportSource": "@imprint/react"
  }
}
```

Or per-file:

```tsx
/** @jsxImportSource @imprint/react */
import { Document, Page } from '@imprint/react';
```

## ESLint plugin

The `@imprint/eslint-plugin` catches PDF-specific errors before TypeScript does:

- `imprint/no-unsupported-css` — warns on CSS properties that have no PDF output.
- `imprint/no-missing-alt` — errors on `<Image>` without `alt`.
- `imprint/no-hover-variants` — warns on `hover:`, `focus:`, `active:`.

See the [ESLint plugin README](../../packages/eslint-plugin/README.md).
