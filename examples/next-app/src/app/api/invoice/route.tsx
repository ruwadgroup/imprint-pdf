import { pdf } from '@imprint-pdf/next';
import { Invoice } from '@/templates/invoice';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = () =>
  pdf(
    <Invoice invoice={{ id: 'INV-001', customer: 'Acme Corp', total: 4200, date: '2026-04-29' }} />,
    { filename: 'invoice.pdf' },
  );
