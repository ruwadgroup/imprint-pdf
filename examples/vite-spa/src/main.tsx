// Compiled at build time from ./src/app.css (the project theme) by the
// imprint() Vite plugin. Passing it to pdf() makes the browser render with the
// real project Tailwind theme - no Tailwind engine in the bundle.
import { classMap } from 'virtual:imprint-classes';
import { Document, Page, pdf } from '@imprint-pdf/react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

function BrandInvoice() {
  return (
    <Document title="Brand invoice">
      <Page size="A4" className="bg-white font-sans p-12 text-slate-900">
        <h1 className="text-brand text-3xl font-bold tracking-tight">Northwind Studio</h1>
        <p className="text-slate-500 mt-1">Invoice INV-2026-0042</p>
        <div className="border-t border-brand mt-6 pt-4 flex flex-row justify-between">
          <span className="text-sm font-semibold">Total due</span>
          <span className="text-xl font-bold text-brand">$12,360.00</span>
        </div>
      </Page>
    </Document>
  );
}

async function openPdf() {
  // `text-brand` / `border-brand` resolve via the precompiled project theme.
  const bytes = await pdf(<BrandInvoice />, { as: 'bytes', tailwind: { classMap } });
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  window.open(url);
}

function App() {
  const [busy, setBusy] = useState(false);
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem', textAlign: 'center' }}>
      <h1>imprint-pdf - Vite SPA</h1>
      <p>Render a PDF in the browser using the project's real Tailwind theme.</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void openPdf().finally(() => setBusy(false));
        }}
      >
        {busy ? 'Rendering…' : 'Open branded PDF'}
      </button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
