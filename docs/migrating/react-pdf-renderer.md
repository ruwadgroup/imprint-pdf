# Migrating from `@react-pdf/renderer`

Same React reconciler concept, similar component names. The migration is mostly
mechanical with a few deliberate upgrades.

## Key differences

| `@react-pdf/renderer`                    | imprint-pdf                                  |
| ---------------------------------------- | -------------------------------------------- |
| `StyleSheet.create({})` or inline styles | Tailwind classes via `className`             |
| Flexbox only (Yoga)                      | Block + Flexbox + CSS Grid (Taffy)           |
| `fontkit` shaping (no OpenType layout)   | HarfBuzz shaping (GSUB/GPOS, ligatures, CJK) |
| Greedy line breaking                     | Knuth–Plass (default)                        |
| No AcroForms                             | `<Form>`, `<TextField>`, `<Signature>`, etc. |
| No PDF/X, no PDF/UA                      | Optional add-on packages available           |

## Package swap

```bash
pnpm remove @react-pdf/renderer react-pdf-tailwind
pnpm add @imprint-pdf/react @imprint-pdf/core tailwindcss
```

## Component renames

| `@react-pdf/renderer` | `@imprint-pdf/react`              |
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

### After (imprint-pdf)

```tsx
import { View } from '@imprint-pdf/react';

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
import { pdf } from '@imprint-pdf/react';

const response = await pdf(<Doc />);                  // → Response
const buffer = await pdf(<Doc />, { as: 'bytes' });   // → Uint8Array
const stream = await pdf(<Doc />, { as: 'stream' }); // → ReadableStream
```

(`renderToBuffer` and `renderToStream` are still exported as lower-level
primitives — use them when you want to skip the auto-config load.)

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

If you stacked `react-pdf-tailwind` on top of `@react-pdf/renderer`, your
`tw('…')` calls become standard `className` props — no translation layer:

```tsx
// Before
<div style={tw('flex flex-row justify-between')}>

// After
<div className="flex flex-row justify-between">
```

CSS Grid, arbitrary values, plugins, and `@theme` tokens — none of which
`react-pdf-tailwind` could support — all work now.
