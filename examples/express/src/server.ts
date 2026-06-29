import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import express from 'express';

const app = express();

app.get('/invoice', async (_req, res) => {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  res.type('application/pdf').send(Buffer.from(bytes));
});

app.listen(3000, () => {
  console.log('http://localhost:3000/invoice');
});
