import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import Fastify from 'fastify';

const app = Fastify();

app.get('/invoice', async (_req, reply) => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  reply.type('application/pdf').send(Buffer.from(bytes));
});

await app.listen({ port: 3000 });
console.log('http://localhost:3000/invoice');
