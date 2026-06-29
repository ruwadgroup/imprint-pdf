import { Queue } from 'bullmq';
import type { RenderJob } from './worker.js';

const connection = { host: '127.0.0.1', port: 6379 };

const queue = new Queue<RenderJob>('pdf', { connection });

await queue.add('render', { docId: process.argv[2] ?? 'invoice' });

console.log('  enqueued render job');
await queue.close();
