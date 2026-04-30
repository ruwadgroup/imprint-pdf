export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface Party {
  name: string;
  address: string;
  email: string;
}

export interface InvoiceData {
  number: string;
  date: string;
  due: string;
  from: Party;
  to: Party;
  items: InvoiceItem[];
  taxRate: number;
  notes: string;
}

export const invoice: InvoiceData = {
  number: 'INV-2025-0042',
  date: 'April 29, 2025',
  due: 'May 29, 2025',
  from: {
    name: 'Imprint Studio LLC',
    address: '340 Pine Street, Suite 800\nSan Francisco CA 94104',
    email: 'billing@imprint.dev',
  },
  to: {
    name: 'Acme Corporation',
    address: '1600 Amphitheatre Pkwy\nMountain View CA 94043',
    email: 'finance@acme.example',
  },
  items: [
    { description: 'Design system audit', qty: 1, rate: 4_500 },
    { description: 'PDF rendering engine licence', qty: 1, rate: 2_400 },
    { description: 'Custom font integration', qty: 3, rate: 800 },
    { description: 'QA & accessibility review', qty: 8, rate: 150 },
    { description: 'Expedited delivery', qty: 1, rate: 350 },
  ],
  taxRate: 0.085,
  notes:
    'Payment by bank transfer. Please quote the invoice number as reference. Thank you for choosing Imprint Studio.',
};
