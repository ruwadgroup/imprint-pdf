export interface InvoiceItem {
  description: string;
  /** Line-item code shown as a muted subtitle under the description. */
  sku: string;
  qty: number;
  rate: number;
}

export interface InvoiceData {
  number: string;
  date: string;
  dueDate: string;
  terms: string;
  from: { name: string; email: string; address: string };
  to: { name: string; email: string; address: string };
  items: InvoiceItem[];
  taxRate: number;
  /** Flat discount applied before tax. */
  discount: number;
  notes: string;
}

export const invoiceSample: InvoiceData = {
  number: 'INV-2026-0042',
  date: 'Apr 29, 2026',
  dueDate: 'May 29, 2026',
  terms: 'Net 30',
  from: {
    name: 'Northwind Studio',
    email: 'billing@northwind.studio',
    address: '24 Harbor Lane, Sausalito, CA 94965',
  },
  to: {
    name: 'Acme Corporation',
    email: 'ap@acme.com',
    address: '500 Market Street, San Francisco, CA 94105',
  },
  items: [
    { description: 'Brand identity system', sku: 'BRD-IDENT-01', qty: 1, rate: 4800 },
    { description: 'Marketing site design', sku: 'WEB-MKTG-02', qty: 1, rate: 6200 },
    { description: 'Design tokens & handoff', sku: 'SYS-TOKENS-12', qty: 12, rate: 145 },
    { description: 'Stakeholder workshops', sku: 'SVC-WRKSHP-03', qty: 3, rate: 850 },
  ],
  taxRate: 0.0825,
  discount: 750,
  notes: 'Payment due within 30 days. Bank details on the attached remittance slip.',
};
