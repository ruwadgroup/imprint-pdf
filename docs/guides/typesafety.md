# Type safety

The JSX surface is fully typed. Every prop is typed. Nothing accepts `any` where
a specific type is expected.

## Component props

All components ship strict types:

```tsx
// TypeScript error — 'invalid' is not a valid size
<Page size="invalid" />

// TypeScript error — bleed requires @imprint-pdf/print
// (surfaced via a branded type on the prop)
<Page bleed="3mm" />
```

## `defineConfig` is type-preserving

`defineConfig` from `@imprint-pdf/core/config` returns the input type, not a
widened `AutotranslateConfig`. IDE autocomplete works on every field.

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
import { pdf } from '@imprint-pdf/react';

// Overloads narrow the return type by the literal value of `as`.
const response = await pdf(<Invoice data={data} />);
//    ^ Response

const bytes = await pdf(<Invoice data={data} />, { as: 'bytes' });
//    ^ Uint8Array

const stream = await pdf(<Invoice data={data} />, { as: 'stream' });
//    ^ ReadableStream<Uint8Array>
```

## JSX namespace

imprint-pdf registers its own JSX namespace for `className`-bearing document
components. Applying `className` to a `<Page>` from a different namespace is a
type error.

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

`@imprint-pdf/eslint` catches PDF-specific errors before TypeScript does:

- `imprint/no-unsupported-css` — warns on CSS properties that have no PDF
  output.
- `imprint/no-missing-alt` — errors on `<Image>` without `alt`.
- `imprint/no-hover-variants` — warns on `hover:`, `focus:`, `active:`.

See the [ESLint plugin README](../../packages/eslint/README.md).

## React version & compiler compatibility

Runs on **React 18 and React 19** with no extra installs. `@imprint-pdf/react`
bundles both `react-reconciler@^0.29` (R18) and `^0.33` (R19) under aliased
names and picks one at module load via `React.version`.

```bash
# React 18 or React 19 — same install
pnpm add @imprint-pdf/react react@^18  # or react@^19
```

**JSX transforms.** Works under both the automatic runtime (`jsx: react-jsx`,
the TS 4.1+ default) and the classic runtime (`jsx: react`, requires
`import React from 'react'`). imprint-pdf emits `react-jsx` output but never
touches R19-only JSX features (refs as plain props, async components, etc.), so
the compiled distribution runs on either.

**React Compiler.** Compatible with — but does **not** require —
`babel-plugin-react-compiler`. No public component relies on Compiler-only
invariants. Enable it in your app and imprint-pdf compiles alongside it. Disable
it and nothing breaks.
