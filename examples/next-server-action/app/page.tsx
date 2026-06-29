import { DownloadInvoice } from './download-invoice'

export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 48 }}>
      <h1>imprint-pdf - Next.js Server Action</h1>
      <DownloadInvoice />
    </main>
  )
}
