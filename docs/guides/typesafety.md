# Type safety

imprint-pdf's JSX surface is fully typed. Every component prop is typed. Nothing
accepts `any` where a specific type is expected.

## Component props

All components ship strict TypeScript types:

```tsx
// TypeScript error — 'invalid' is not a valid size
<Page size="invalid" />

// TypeScript error — bleed requires @imprint-pdf/print
// (surfaced via a branded type on the prop)
<Page bleed="3mm" />
```

## `defineConfig` is type-preserving

The `defineConfig` helper from `@imprint-pdf/core/config` returns the input
type, not a widened `AutotranslateConfig`. Your IDE autocompletes every field.

```ts
// ✓ Autocompletes; errors on unknown fields
export default defineConfig({
  fonts: [{ family: 'Inter', src: './fonts/Inter.woff2' }],
  // tailwind.stylesheet auto-detects src/app.css, src/globals.css, etc.
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

imprint-pdf registers its own JSX namespace for the `className`-bearing document
components. Applying `className` to a `<Page>` from a different namespace would
be a type error.

```ts
// tsconfig.json
{
  "compilerOptions": {
    "jsxImportSource": "@imprint-pdf/react"
  }
}
```

Or per-file:

```tsx
/** @jsxImportSource @imprint-pdf/react */
import { Document, Page } from '@imprint-pdf/react';
```

## ESLint plugin

The `@imprint-pdf/eslint` catches PDF-specific errors before TypeScript does:

- `imprint/no-unsupported-css` — warns on CSS properties that have no PDF
  output.
- `imprint/no-missing-alt` — errors on `<Image>` without `alt`.
- `imprint/no-hover-variants` — warns on `hover:`, `focus:`, `active:`.

See the [ESLint plugin README](../../packages/eslint/README.md).

## React version & compiler compatibility

imprint-pdf runs on **React 18 and React 19** with zero extra installs.
`@imprint-pdf/react` bundles both `react-reconciler@^0.29` (React 18) and
`^0.33` (React 19) under aliased package names and picks the matching one at
module load via `React.version`.

```bash
# React 18 or React 19 — same install
pnpm add @imprint-pdf/react react@^18  # or react@^19
```

**JSX transforms.** imprint-pdf works under both the automatic runtime
(`jsx: react-jsx`, the default since TypeScript 4.1) and the classic runtime
(`jsx: react`, requires `import React from 'react'`). The library itself emits
`react-jsx` output but never touches React-19-only JSX features (refs as plain
props, async components, etc.), so the compiled distribution runs on either
runtime.

**React Compiler.** imprint-pdf is compatible with — but does **not** require —
`babel-plugin-react-compiler`. None of the public components rely on
Compiler-only invariants. If you enable the Compiler in your app, imprint-pdf
components compile cleanly alongside it; if you don't, nothing breaks.
