import { createServer } from 'node:http';
import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { appRouter } from './router.js';

const trpc = createHTTPHandler({ router: appRouter });

const server = createServer(async (req, res) => {
  // Binary sibling: the RPC layer ships base64, but a browser wants the file.
  if (req.url === '/invoice.pdf') {
    const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
    res.writeHead(200, { 'content-type': 'application/pdf' });
    res.end(Buffer.from(bytes));
    return;
  }
  trpc(req, res);
});

server.listen(3000, () => {
  console.log('RPC: http://localhost:3000/invoice');
  console.log('PDF: http://localhost:3000/invoice.pdf');
});
