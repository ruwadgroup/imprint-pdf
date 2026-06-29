import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';

const server = Bun.serve({
  port: 3000,
  fetch: () => pdf(byId('invoice')!.render()),
});

console.log(`http://localhost:${server.port}`);
