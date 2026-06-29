import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = () => pdf(byId('invoice')!.render(), { filename: 'invoice.pdf' });
