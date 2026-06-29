import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';
import { Elysia } from 'elysia';

new Elysia().get('/invoice', () => pdf(byId('invoice')!.render())).listen(3000);

console.log('http://localhost:3000/invoice');
