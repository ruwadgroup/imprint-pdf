/**
 * Competitor suite — same 1-page invoice rendered by the two real
 * React-based competitors:
 *
 *   1. Imprint              (@imprint/react — JSX, real CSS, real layout)
 *   2. @react-pdf/renderer  (JSX, custom StyleSheet DSL, no real CSS)
 *
 * Imperative libraries (pdfkit / pdf-lib / jsPDF) and template-based ones
 * (pdfme) live in different paradigms — pitting Imprint against a
 * coordinate-pushing API makes the layout engine look like overhead even
 * though the user-facing trade is opposite. Chromium has its own suite.
 *
 * @react-pdf/renderer is dynamically imported so the heavy module doesn't
 * load unless this suite runs.
 */

import { renderToBuffer } from '@imprint/react';
import React from 'react';
import { INVOICE_DATA, InvoiceDoc } from '../fixtures/invoice.js';
import { type BenchResult, bench } from '../runner.js';

async function imprintInvoice(): Promise<Uint8Array> {
  return renderToBuffer(React.createElement(InvoiceDoc));
}

async function reactPdfInvoice(): Promise<Uint8Array> {
  const { Document, Page, View, Text, pdf, StyleSheet } = await import('@react-pdf/renderer');

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
    bigTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a56db' },
    companyName: { fontSize: 20, fontWeight: 'bold' },
    label: { fontSize: 8, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f3f4f6',
      padding: 4,
      borderBottom: '1pt solid #e5e7eb',
    },
    tableRow: { flexDirection: 'row', padding: 4, borderBottom: '1pt solid #f3f4f6' },
    thDesc: { flex: 3, fontSize: 8, color: '#6b7280', textTransform: 'uppercase' },
    th: { flex: 1, fontSize: 8, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' },
    tdDesc: { flex: 3 },
    td: { flex: 1, textAlign: 'right' },
    totalsBlock: { alignItems: 'flex-end', marginTop: 16 },
    totalRow: {
      flexDirection: 'row',
      width: 200,
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    grandTotal: { fontWeight: 'bold', fontSize: 12 },
  });

  const d = INVOICE_DATA;

  const element = React.createElement(
    Document,
    { title: `Invoice ${d.invoiceNumber}` },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.companyName }, d.from.name),
          React.createElement(Text, null, d.from.address),
          React.createElement(Text, null, d.from.city),
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.bigTitle }, 'INVOICE'),
          React.createElement(Text, null, d.invoiceNumber),
          React.createElement(Text, null, `Date: ${d.date}`),
        ),
      ),
      React.createElement(
        View,
        { style: styles.metaRow },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.label }, 'Billed From'),
          React.createElement(Text, null, d.from.name),
          React.createElement(Text, null, d.from.address),
          React.createElement(Text, null, d.from.city),
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.label }, 'Billed To'),
          React.createElement(Text, null, d.to.name),
          React.createElement(Text, null, d.to.address),
          React.createElement(Text, null, d.to.city),
        ),
      ),
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.thDesc }, 'Description'),
        React.createElement(Text, { style: styles.th }, 'Qty'),
        React.createElement(Text, { style: styles.th }, 'Unit Price'),
        React.createElement(Text, { style: styles.th }, 'Amount'),
      ),
      ...d.items.map((item) =>
        React.createElement(
          View,
          { style: styles.tableRow, key: item.description },
          React.createElement(Text, { style: styles.tdDesc }, item.description),
          React.createElement(Text, { style: styles.td }, String(item.qty)),
          React.createElement(Text, { style: styles.td }, `$${item.unitPrice.toFixed(2)}`),
          React.createElement(Text, { style: styles.td }, `$${item.amount.toFixed(2)}`),
        ),
      ),
      React.createElement(
        View,
        { style: styles.totalsBlock },
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, null, 'Subtotal'),
          React.createElement(Text, null, `$${d.subtotal.toFixed(2)}`),
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, null, 'Tax (8%)'),
          React.createElement(Text, null, `$${d.tax.toFixed(2)}`),
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.grandTotal }, 'Total'),
          React.createElement(Text, { style: styles.grandTotal }, `$${d.total.toFixed(2)}`),
        ),
      ),
    ),
  );

  const blob = await pdf(element).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function runCompetitors(runs: number, warmup: number): Promise<BenchResult[]> {
  const results: BenchResult[] = [];

  results.push(await bench('Imprint', imprintInvoice, runs, warmup));
  results.push(await bench('@react-pdf/renderer', reactPdfInvoice, runs, warmup));

  return results;
}
