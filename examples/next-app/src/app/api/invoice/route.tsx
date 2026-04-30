import { renderToServer } from '@imprint/next';
import { Invoice } from '@/templates/invoice';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const pdf = await renderToServer(
    <Invoice
      invoice={{
        id: 'INV-001',
        customer: 'Acme Corp',
        total: 4200,
        date: '2026-04-29',
      }}
    />,
  );

  return new Response(Buffer.from(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="invoice.pdf"',
    },
  });
}
