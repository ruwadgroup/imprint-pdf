/**
 * Invoice fixture — used by all three competitors (Imprint, react-pdf, pdfkit).
 *
 * `InvoiceDoc` is a valid React element for Imprint's `renderToBuffer`.
 * `INVOICE_DATA` is exported as a plain object so the pdfkit implementation
 * can read the same values without any React dependency.
 */

import { Document, Page } from '@imprint/react';
import type React from 'react';

export interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  from: { name: string; address: string; city: string };
  to: { name: string; address: string; city: string };
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export const INVOICE_DATA: InvoiceData = {
  invoiceNumber: 'INV-2024-0042',
  date: '2024-05-01',
  from: {
    name: 'Acme Corp',
    address: '123 Main Street',
    city: 'San Francisco, CA 94105',
  },
  to: {
    name: 'Widgets LLC',
    address: '456 Market Ave',
    city: 'New York, NY 10001',
  },
  items: [
    { description: 'Widget Pro (annual)', qty: 1, unitPrice: 1200.0, amount: 1200.0 },
    { description: 'Support & maintenance', qty: 12, unitPrice: 99.0, amount: 1188.0 },
    { description: 'Onboarding session', qty: 3, unitPrice: 250.0, amount: 750.0 },
    { description: 'Custom integration', qty: 1, unitPrice: 3500.0, amount: 3500.0 },
    { description: 'Training workshop', qty: 2, unitPrice: 400.0, amount: 800.0 },
  ],
  subtotal: 7438.0,
  tax: 595.04,
  total: 8033.04,
};

const s = {
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' } as Record<
    string,
    unknown
  >,
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  } as Record<string, unknown>,
  companyName: { fontSize: 20, fontWeight: 'bold', color: '#111' } as Record<string, unknown>,
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a56db',
    textAlign: 'right',
  } as Record<string, unknown>,
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  } as Record<string, unknown>,
  label: { fontSize: 8, textTransform: 'uppercase', color: '#888', marginBottom: 4 } as Record<
    string,
    unknown
  >,
  value: { fontSize: 10, color: '#111' } as Record<string, unknown>,
  table: { width: '100%', marginTop: 24 } as Record<string, unknown>,
  thead: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: '6px 0',
    borderBottom: '1px solid #e5e7eb',
  } as Record<string, unknown>,
  th: {
    flex: 1,
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#6b7280',
    paddingLeft: 4,
  } as Record<string, unknown>,
  thRight: {
    flex: 1,
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#6b7280',
    textAlign: 'right',
    paddingRight: 4,
  } as Record<string, unknown>,
  tr: {
    display: 'flex',
    flexDirection: 'row',
    padding: '5px 0',
    borderBottom: '1px solid #f3f4f6',
  } as Record<string, unknown>,
  td: { flex: 1, paddingLeft: 4 } as Record<string, unknown>,
  tdRight: { flex: 1, textAlign: 'right', paddingRight: 4 } as Record<string, unknown>,
  totalsBlock: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  } as Record<string, unknown>,
  totalRow: {
    display: 'flex',
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    marginBottom: 4,
  } as Record<string, unknown>,
  totalLabel: { color: '#6b7280' } as Record<string, unknown>,
  grandTotal: { fontWeight: 'bold', fontSize: 12, color: '#111' } as Record<string, unknown>,
};

export function InvoiceDoc(): React.ReactElement {
  const d = INVOICE_DATA;

  return (
    <Document title={`Invoice ${d.invoiceNumber}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <p style={s.companyName}>{d.from.name}</p>
            <p style={{ color: '#6b7280', marginTop: 4 }}>{d.from.address}</p>
            <p style={{ color: '#6b7280' }}>{d.from.city}</p>
          </div>
          <div>
            <p style={s.invoiceTitle}>INVOICE</p>
            <p style={{ textAlign: 'right', marginTop: 4, color: '#6b7280' }}>{d.invoiceNumber}</p>
            <p style={{ textAlign: 'right', color: '#6b7280' }}>Date: {d.date}</p>
          </div>
        </div>

        {/* Billed-to */}
        <div style={s.metaRow}>
          <div>
            <p style={s.label}>Billed From</p>
            <p style={s.value}>{d.from.name}</p>
            <p style={{ color: '#555' }}>{d.from.address}</p>
            <p style={{ color: '#555' }}>{d.from.city}</p>
          </div>
          <div>
            <p style={s.label}>Billed To</p>
            <p style={s.value}>{d.to.name}</p>
            <p style={{ color: '#555' }}>{d.to.address}</p>
            <p style={{ color: '#555' }}>{d.to.city}</p>
          </div>
        </div>

        {/* Line items table */}
        <div style={s.table}>
          <div style={s.thead}>
            <span style={{ ...s.th, flex: 3 }}>Description</span>
            <span style={s.thRight}>Qty</span>
            <span style={s.thRight}>Unit Price</span>
            <span style={s.thRight}>Amount</span>
          </div>
          {d.items.map((item, i) => (
            <div key={i} style={s.tr}>
              <span style={{ ...s.td, flex: 3 }}>{item.description}</span>
              <span style={s.tdRight}>{item.qty}</span>
              <span style={s.tdRight}>${item.unitPrice.toFixed(2)}</span>
              <span style={s.tdRight}>${item.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={s.totalsBlock}>
          <div style={s.totalRow}>
            <span style={s.totalLabel}>Subtotal</span>
            <span>${d.subtotal.toFixed(2)}</span>
          </div>
          <div style={s.totalRow}>
            <span style={s.totalLabel}>Tax (8%)</span>
            <span>${d.tax.toFixed(2)}</span>
          </div>
          <div
            style={{ ...s.totalRow, borderTop: '1px solid #e5e7eb', paddingTop: 4, marginTop: 4 }}
          >
            <span style={s.grandTotal}>Total</span>
            <span style={s.grandTotal}>${d.total.toFixed(2)}</span>
          </div>
        </div>
      </Page>
    </Document>
  );
}
