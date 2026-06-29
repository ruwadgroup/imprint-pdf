import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { createServerFn } from '@tanstack/react-start';

// This version of TanStack Start exposes `createServerFn` (RPC-style server
// function) as its stable server primitive, not a raw file-based API route. The
// PDF is rendered on the server and returned as base64 for the client to turn
// into a Blob download.
export const getInvoicePdf = createServerFn({ method: 'GET' }).handler(async () => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  return Buffer.from(bytes).toString('base64');
});
