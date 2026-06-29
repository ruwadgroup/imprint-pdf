import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import Router from '@koa/router';
import Koa from 'koa';

const app = new Koa();
const router = new Router();

router.get('/invoice', async (ctx) => {
  ctx.type = 'application/pdf';
  ctx.body = Buffer.from(await pdf(byId('invoice')!.render(), { as: 'bytes' }));
});

app.use(router.routes());
app.listen(3000, () => {
  console.log('http://localhost:3000/invoice');
});
