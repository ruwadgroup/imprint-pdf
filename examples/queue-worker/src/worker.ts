import { mkdir, writeFile } from 'node:fs/promises';
import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { Worker } from 'bullmq';

export interface RenderJob {
  docId?: string;
}

const connection = { host: '127.0.0.1', port: 6379 };

const worker = new Worker<RenderJob>(
  'pdf',
  async (job) => {
    const bytes = await pdf(byId(job.data.docId ?? 'invoice')!.render(), { as: 'bytes' });
    await mkdir(new URL('../out/', import.meta.url), { recursive: true });
    await writeFile(new URL(`../out/${job.id}.pdf`, import.meta.url), bytes);
  },
  { connection },
);

worker.on('completed', (job) => console.log(`  ✓  job ${job.id} → out/${job.id}.pdf`));
