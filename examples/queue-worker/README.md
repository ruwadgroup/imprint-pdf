# example - queue-worker

BullMQ worker that renders a fixture per job and writes the PDF to disk, plus a
small enqueuer. Models the "render PDFs off the request path" pattern.

## What's shown

The Category F job glue: a `Worker('pdf', …)` renders the job's document via the
node `pdf` entry and writes it under `./out/<job.id>.pdf`.

```ts
new Worker<RenderJob>('pdf', async (job) => {
  const bytes = await pdf(byId(job.data.docId ?? 'invoice')!.render(), {
    as: 'bytes',
  });
  await writeFile(new URL(`../out/${job.id}.pdf`, import.meta.url), bytes);
});
```

## Run

Requires a running Redis (BullMQ's broker), e.g.
`docker run -p 6379:6379 redis`.

```bash
pnpm --filter @imprint-pdf/example-queue-worker worker    # start the worker
pnpm --filter @imprint-pdf/example-queue-worker enqueue    # add a job (optional docId arg)
```

`typecheck` needs no Redis - only the `bullmq` types.

## DX notes

- **Category:** F (background job, bytes → `fs.writeFile`)
- **Entry:** `node` - `import { pdf } from '@imprint-pdf/react'`
- **Glue:** 2 lines inside the worker handler (`pdf` → `writeFile`)
- **Rating:** 🟡 - the render glue is trivial, but running it needs a Redis
  broker; typechecking does not.
