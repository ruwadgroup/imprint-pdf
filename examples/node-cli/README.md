# example - node-cli

Node CLI that renders **every** document in the fixture corpus to `./out/` and
logs each id with its size in KB. This is the local render smoke test for the
whole corpus.

## What's shown

The Category F batch glue: iterate `documents`, render each via the node `pdf`
entry, and write the bytes with `node:fs/promises`.

```ts
for (const doc of documents) {
  const bytes = await pdf(doc.render(), { as: 'bytes' });
  await writeFile(new URL(`${doc.id}.pdf`, OUT_DIR), bytes);
}
```

## Run

```bash
pnpm --filter @imprint-pdf/example-node-cli generate
# → writes ./out/<id>.pdf for all 15 fixtures
```

## DX notes

- **Category:** F (CLI/batch, bytes → `fs.writeFile`)
- **Entry:** `node` - `import { pdf } from '@imprint-pdf/react'`
- **Glue:** ~4 lines (loop, `pdf`, `writeFile`, log)
- **Rating:** 🟢 - one loop renders the entire corpus; the node entry needs no
  setup.
