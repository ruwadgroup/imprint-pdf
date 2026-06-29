# example - electron

Electron desktop app that renders the `invoice` fixture in the **main process**
and writes it to disk through a native save dialog.

## What's shown

The Category E desktop glue: the main process is Node, so it uses the node `pdf`
entry, renders a fixture to bytes, and pipes them through
`dialog.showSaveDialog`

- `fs.writeFile`.

```ts
const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
const { canceled, filePath } = await dialog.showSaveDialog({
  defaultPath: 'invoice.pdf',
});
if (!canceled && filePath) await writeFile(filePath, bytes);
```

## Run

```bash
pnpm --filter @imprint-pdf/example-electron typecheck
# build to dist/ then `electron .` to launch the save dialog
```

## DX notes

- **Category:** E (desktop, main-process bytes → save dialog → `fs.writeFile`)
- **Entry:** `node` - `import { pdf } from '@imprint-pdf/react'`
- **Glue:** 3 lines (`pdf` → `showSaveDialog` → `writeFile`)
- **Rating:** 🟡 - the render glue is trivial, but Electron pulls a heavy
  toolchain (Chromium binary, its own type bundle) around three lines of work.
