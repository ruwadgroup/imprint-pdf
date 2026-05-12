export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-12 font-sans">
      <h1 className="text-3xl font-bold tracking-tight">
        imprint-pdf · React 18 · Tailwind v3 smoke
      </h1>
      <p className="text-sm text-gray-600 max-w-xl text-center">
        This example exercises the React 18 reconciler path and the Tailwind v3
        PostCSS dispatch in `@imprint-pdf/tailwind`.
      </p>
      <a
        href="/api/invoice"
        className="rounded-full bg-black text-white text-sm h-10 px-5 inline-flex items-center"
      >
        Render PDF →
      </a>
    </main>
  );
}
