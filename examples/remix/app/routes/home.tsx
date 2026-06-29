export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 48 }}>
      <h1>imprint-pdf · React Router v7</h1>
      <p>
        {/* Plain anchor (not a client-side Link) so the browser performs a real
            document request and receives the PDF Response from the loader. */}
        <a href="/invoice.pdf">Download invoice.pdf</a>
      </p>
    </main>
  );
}
