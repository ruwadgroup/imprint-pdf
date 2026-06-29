import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

async function openInvoice() {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' });
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  window.open(url);
}

function App() {
  const [busy, setBusy] = useState(false);
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem', textAlign: 'center' }}>
      <h1>imprint-pdf - Vite SPA</h1>
      <p>Render the invoice fixture to a PDF entirely in the browser.</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void openInvoice().finally(() => setBusy(false));
        }}
      >
        {busy ? 'Rendering…' : 'Open invoice PDF'}
      </button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
