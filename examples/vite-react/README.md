# example — vite-react

Vite + React SPA demo for
[Imprint](https://github.com/tamimbinhakim/imprint-pdf). Generates PDFs entirely
in the browser — no server required.

```bash
pnpm --filter @imprint-pdf/example-vite-react dev
```

## What's demonstrated

- **`src/templates/Resume.tsx`** — single-page resume with Tailwind layout,
  custom Inter font, and SVG icon embedding.
- **`src/templates/Certificate.tsx`** — certificate with decorative border,
  custom fonts, and a `<Signature>` widget.
- **`src/App.tsx`** — a minimal UI that calls `renderToBuffer` on button click
  and triggers a browser download.
- **`vite.config.ts`** — `imprint()` plugin wiring.

## Structure

```
examples/vite-react/
├── public/fonts/
├── src/
│   ├── templates/
│   │   ├── Resume.tsx
│   │   └── Certificate.tsx
│   ├── App.tsx
│   └── main.tsx
├── imprint.config.ts
└── vite.config.ts
```
