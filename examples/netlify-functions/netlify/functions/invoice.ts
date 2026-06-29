import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';
import type { Config } from '@netlify/functions';

export default async () => pdf(byId('invoice')!.render());

export const config: Config = { path: '/invoice' };
