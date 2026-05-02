import { Document, Page, renderToBuffer } from '@imprint-pdf/react';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// ---------------------------------------------------------------------------
// Invoice PDF template
// ---------------------------------------------------------------------------

interface InvoiceProps {
  id: string;
  customer: string;
  total: number;
  date: string;
}

function Invoice({ id, customer, total, date }: InvoiceProps) {
  return (
    <Document title={`Invoice ${id}`}>
      <Page size="A4" className="p-12 font-sans bg-white text-gray-900">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
          <span className="text-sm text-gray-500">#{id}</span>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-500 font-medium">Bill to</p>
          <p className="text-base mt-1">{customer}</p>
        </div>
        <div className="flex-1" />
        <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between">
          <span className="text-sm font-medium">Due date</span>
          <span className="text-sm text-gray-600">{date}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-base font-semibold">Total</span>
          <span className="text-xl font-bold">${total.toLocaleString()}</span>
        </div>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadInvoice() {
    setLoading(true);
    setError(null);
    try {
      const pdf = await renderToBuffer(
        <Invoice id="INV-001" customer="Acme Corp" total={4200} date="2026-04-29" />,
      );
      const blob = new Blob([pdf as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        gap: '1rem',
        background: '#f9fafb',
      }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Imprint Demo</h1>
      <p style={{ color: '#6b7280', margin: 0 }}>
        Generate a PDF invoice entirely in the browser — no server needed.
      </p>
      <button
        type="button"
        onClick={() => void downloadInvoice()}
        disabled={loading}
        style={{
          padding: '0.625rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          background: loading ? '#d1d5db' : '#111827',
          color: '#fff',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Generating...' : 'Download Invoice PDF'}
      </button>
      {error && <p style={{ color: '#ef4444', maxWidth: '32rem', textAlign: 'center' }}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
