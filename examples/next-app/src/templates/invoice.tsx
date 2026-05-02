import { Document, Page } from '@imprint-pdf/react';

interface InvoiceData {
  id: string;
  customer: string;
  total: number;
  date: string;
}

interface InvoiceProps {
  invoice: InvoiceData;
}

export function Invoice({ invoice }: InvoiceProps) {
  return (
    <Document title={`Invoice ${invoice.id}`} author="imprint-pdf Example">
      <Page size="A4" className="p-12 font-sans bg-white text-gray-900">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <span className="text-3xl font-bold tracking-tight">Invoice</span>
          <span className="text-sm text-gray-500">#{invoice.id}</span>
        </div>

        {/* Bill-to */}
        <div className="mb-8">
          <span className="text-sm text-gray-500 font-medium">Bill to</span>
          <span className="text-base mt-1">{invoice.customer}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Totals */}
        <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between">
          <span className="text-sm font-medium">Due date</span>
          <span className="text-sm text-gray-600">{invoice.date}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-base font-semibold">Total</span>
          <span className="text-xl font-bold">${invoice.total.toLocaleString()}</span>
        </div>
      </Page>
    </Document>
  );
}
