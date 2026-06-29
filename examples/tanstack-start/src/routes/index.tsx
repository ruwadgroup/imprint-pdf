import { createFileRoute } from '@tanstack/react-router';
import { getInvoicePdf } from '../pdf';

export const Route = createFileRoute('/')({
  component: Home,
});

async function download() {
  const base64 = await getInvoicePdf();
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  window.open(url);
}

function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 48 }}>
      <h1>imprint-pdf · TanStack Start</h1>
      <button type="button" onClick={() => void download()}>
        Render invoice.pdf (server function)
      </button>
    </main>
  );
}
