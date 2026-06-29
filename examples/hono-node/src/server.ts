import { serve } from '@hono/node-server';
import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { Hono } from 'hono';

const app = new Hono();

app.get('/invoice', (_c) => pdf(byId('invoice')!.render()));

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('http://localhost:3000/invoice');
});
