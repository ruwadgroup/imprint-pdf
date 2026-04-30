# Migrating from `@react-pdf/renderer`

`@react-pdf/renderer` and Imprint share the same React reconciler concept and
similar component names. The migration is mostly mechanical, with a few
deliberate improvements.

## Key differences

| `@react-pdf/renderer`                    | Imprint                                      |
| ---------------------------------------- | -------------------------------------------- |
| `StyleSheet.create({})` or inline styles | Tailwind classes via `className`             |
| Flexbox only (Yoga)                      | Block + Flexbox + CSS Grid (Taffy)           |
| `fontkit` shaping (no OpenType layout)   | HarfBuzz shaping (GSUB/GPOS, ligatures, CJK) |
| Greedy line breaking                     | Knuth–Plass (default)                        |
| No AcroForms                             | `<Form>`, `<TextField>`, `<Signature>`, etc. |
| No PDF/X, no PDF/UA                      | Enterprise packages available                |

## Package swap

```bash
pnpm remove @react-pdf/renderer react-pdf-tailwind
pnpm add @imprint/react @imprint/core
pnpm add -D @imprint/tailwind tailwindcss
```

## Component renames

| `@react-pdf/renderer` | `@imprint/react`                  |
| --------------------- | --------------------------------- |
| `Document`            | `Document`                        |
| `Page`                | `Page`                            |
| `View`                | `View`                            |
| `Text`                | `Text` (or plain `<p>`, `<span>`) |
| `Image`               | `Image`                           |
| `Svg`                 | `Svg`                             |
| `Link`                | `Link`                            |
| `Note`                | removed (not needed in PDFs)      |
| `Canvas`              | Use `<Svg>` instead               |

## Style migration

### Before (`@react-pdf/renderer`)

```tsx
import { StyleSheet, View, Text } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 48,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
});

export function Invoice() {
  return (
    <div style={styles.container}>
      <span style={styles.heading}>Invoice</span>
    </div>
  );
}
```

### After (Imprint)

```tsx
import { View } from '@imprint/react';

export function Invoice() {
  return (
    <div className="flex flex-row justify-between p-12 bg-white">
      <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
    </div>
  );
}
```

## Render function

### Before

```ts
import ReactPDF from '@react-pdf/renderer';

const stream = await ReactPDF.renderToStream(<Doc />);
const buffer = await ReactPDF.renderToBuffer(<Doc />);
```

### After

```ts
import { renderToBuffer, renderToStream } from '@imprint/react';

const buffer = await renderToBuffer(<Doc />);
const stream = await renderToStream(<Doc />);
```

## Font loading

### Before

```ts
Font.register({
  family: 'Inter',
  src: './public/fonts/Inter.woff2',
});
```

### After

```ts
// imprint.config.ts
export default defineConfig({
  fonts: [{ family: 'Inter', src: './public/fonts/Inter.woff2' }],
});
```

## `react-pdf-tailwind` users

If you were using `react-pdf-tailwind` on top of `@react-pdf/renderer`, your
`tw('…')` calls become standard `className` props with no translation layer:

```tsx
// Before
<div style={tw('flex flex-row justify-between')}>

// After
<div className="flex flex-row justify-between">
```

CSS Grid, arbitrary values, plugins, and `@theme` tokens that
`react-pdf-tailwind` couldn't support now work.
