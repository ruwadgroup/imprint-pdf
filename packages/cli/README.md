# @imprint/cli

Command-line tools for [Imprint](https://github.com/tamimbinhakim/imprint).

```bash
pnpm add -D @imprint/cli
```

## Commands

### `imprint render`

Render a React component to a PDF file.

```bash
imprint render ./src/templates/Invoice.tsx --out ./out/invoice.pdf
```

| Flag      | Default     | Description                                  |
| --------- | ----------- | -------------------------------------------- |
| `--out`   | `./out.pdf` | Output file path.                            |
| `--props` | `{}`        | JSON-encoded props to pass to the component. |
| `--watch` | off         | Rebuild on file change.                      |
| `--open`  | off         | Open in the system PDF viewer after render.  |

### `imprint dev`

Live preview server with hot module replacement and an element inspector.

```bash
imprint dev ./src/templates/Invoice.tsx
```

Opens a browser tab at `http://localhost:4000` showing the PDF rendered in real
time. Edit your component or Tailwind classes and the preview updates without a
full rebuild.

### `imprint validate`

Validate a PDF against PDF/X-4 or PDF/UA-1 using veraPDF.

```bash
imprint validate ./out/invoice.pdf --profile pdf-ua-1
```

Requires `@imprint/print` or `@imprint/ua`. Exits non-zero on failure — wire it
into your CI pipeline.

```bash
# In CI
imprint render ./src/Invoice.tsx --out ./dist/invoice.pdf
imprint validate ./dist/invoice.pdf --profile pdf-ua-1
```

### `imprint init`

Scaffold `imprint.config.ts` in the current directory.

```bash
npx imprint init
```

## Config

```ts
// imprint.config.ts
import { defineConfig } from '@imprint/core/config';

export default defineConfig({
  fonts: [
    { family: 'Inter', src: './public/fonts/Inter.woff2' },
    { family: 'JetBrains Mono', src: './public/fonts/JetBrainsMono.woff2' },
  ],
  tailwind: { config: './tailwind.config.ts' },
});
```
