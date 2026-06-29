export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface InvoiceData {
  number: string;
  date: string;
  dueDate: string;
  from: { name: string; email: string };
  to: { name: string; address: string };
  items: InvoiceItem[];
  taxRate: number;
  notes: string;
}

export const invoiceSample: InvoiceData = {
  number: 'INV-2026-0042',
  date: '2026-04-29',
  dueDate: '2026-05-29',
  from: { name: 'Northwind Studio', email: 'billing@northwind.studio' },
  to: { name: 'Acme Corporation', address: '500 Market Street, San Francisco, CA 94105' },
  items: [
    { description: 'Brand identity system', qty: 1, rate: 4800 },
    { description: 'Marketing site design', qty: 1, rate: 6200 },
    { description: 'Design tokens & handoff', qty: 12, rate: 145 },
    { description: 'Stakeholder workshops', qty: 3, rate: 850 },
  ],
  taxRate: 0.0825,
  notes: 'Payment due within 30 days. Bank details on the attached remittance slip.',
};
