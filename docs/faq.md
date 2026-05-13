# FAQ

## Does imprint-pdf support every Tailwind class?

Almost. The actual Tailwind v4 Oxide compiler runs, so plugins, arbitrary
values, `@theme` tokens, and custom variants all work. CSS properties with no
PDF output drop: `hover:`, `focus:`, `transition-*`, `animation-*`,
`position: sticky`, `position: fixed`, `overflow: auto`.

Pass `{ strict: true }` to `pdf()` to warn instead of dropping silently.

## What's the difference between `@imprint-pdf/react` and `@react-pdf/renderer`?

- **Tailwind.** imprint-pdf uses the real Tailwind v4 compiler;
  `@react-pdf/renderer` uses a hand-curated `StyleSheet` DSL on a CSS subset.
- **CSS Grid.** imprint-pdf (Taffy) supports `display: grid`.
  `@react-pdf/renderer` (Yoga) is Flexbox-only.
- **Typography.** imprint-pdf: HarfBuzz shaping + Knuth–Plass.
  `@react-pdf/renderer`: fontkit-only with greedy line breaking.
- **AcroForms.** imprint-pdf has `<TextField>`, `<Signature>`, etc.
  `@react-pdf/renderer` has none.
- **Edge runtime.** imprint-pdf runs on Cloudflare Workers;
  `@react-pdf/renderer` doesn't.

## Can I share my Tailwind config between web and PDF?

Yes — and usually without wiring anything. Tailwind v4 is configured CSS-first,
and imprint-pdf auto-detects your stylesheet from `src/app.css`,
`src/globals.css`, `app/globals.css`, and similar locations. The same `app.css`
your web app uses gives imprint-pdf your colors, spacing, fonts, plugins, and
`@theme` tokens for free.

If your CSS entry lives somewhere unusual, point at it explicitly:

```ts
imprintTailwind({ stylesheet: './src/styles/pdf.css' });
```

For a Tailwind v3 `tailwind.config.ts`, reference it from CSS via
`@config './tailwind.config.ts';` — Tailwind v4 reads it as a compat shim. See
[Tailwind config](integrations/tailwind-config.md).

## Does it run in the browser?

Yes. Default build works in modern browsers with WASM. ~800 KB gzipped. Use
subpath imports to tree-shake.

## Does it support Arabic, Hindi, Thai, CJK?

Yes. HarfBuzz + ICU4X handle bidirectional text, complex shaping (Arabic
Nastaliq, Devanagari, Thai, CJK), GSUB/GPOS kerning, and ligatures. Supply a
font that covers the script; subsetting handles the rest. Enable
language-specific hyphenation via the `hyphenation` config option.

## Can I use custom fonts?

Yes. Point `fonts` in `imprint.config.ts` at local `.woff2`, `.otf`, or `.ttf`
files. Google Fonts and Bunny Fonts work via URL. Variable fonts work — supply
the `axes` you want.

## Is it really faster than Puppeteer?

On cold starts, yes — 10–20×. Chromium: 800–2,000 ms. imprint-pdf: 40–100 ms on
Cloudflare Workers.

On warm throughput for complex JS-heavy documents, Chromium can win — it has a
JIT for the rendering engine. imprint-pdf's sweet spot is paged documents
authored as React components, not converted web pages.

## What's the licensing for the optional add-on packages?

Apache-2.0, same as the rest. No time-bomb, no commercial seat requirement —
`@imprint-pdf/print`, `@imprint-pdf/sign`, and `@imprint-pdf/ua` ship under the
same license as the engine. See [`LICENSING.md`](../LICENSING.md) for the full
list and sponsorship contact.

## Does imprint-pdf render existing HTML or web pages?

No. imprint-pdf renders React component trees authored for PDF output. Not a
"screenshot this URL" tool — use Puppeteer for that. imprint-pdf is the right
tool when you own the template and want it to look good.

## How do I add a watermark / background to every page?

Use `<Page className="relative">` and add an absolutely-positioned `<div>` as
the first child. Absolute positioning inside `<Page>` uses the page coordinate
system.

## Can I generate a PDF/A file for archiving?

PDF/A-2b and PDF/A-3 ship in `@imprint-pdf/print`. PDF/A-3 supports embedded
attachments — used for factur-X and ZUGFeRD e-invoicing.

## How does streaming work?

`pdf(<Doc/>, { as: 'stream' })` returns a `ReadableStream<Uint8Array>` that
emits one chunk per page. First byte arrives in <50 ms for most documents. Use
the default `pdf(<Doc/>)` shape for a ready-to-return `Response` on Cloudflare
Workers and Vercel Edge.

## Why does my deploy fail with `Cannot find module 'react-reconciler-18'`?

Your `next build` produced a `.next/standalone/` artifact (Docker / Coolify /
self-hosted Vercel) but nft didn't copy `react-reconciler`. Upgrade to
`@imprint-pdf/react@1.0.0-alpha.10+` and `@imprint-pdf/next@1.0.0-alpha.10+`,
and wrap `next.config.{js,mjs,ts}` with `withImprint()` from
`@imprint-pdf/next/plugin`. Full explanation in
[Next.js standalone deployments](frameworks/nextjs.md#standalone-deployments).

## Why does my deploy fail with `Cannot find module 'tailwindcss'`?

Same bug family. `tailwindcss` and `postcss` usually live in `devDependencies`,
which nft skips. `withImprint()` (≥ `1.0.0-alpha.8`) sets the externals and
trace-include globs that fix it. Alternatively, move `tailwindcss` + `postcss`
to `dependencies`. See
[Next.js standalone deployments](frameworks/nextjs.md#standalone-deployments).

## `next build` is OOM-killed in `Collecting build traces`. What now?

Tracing walks each route's import graph. With many routes plus a large dep stack
(imprint-pdf + Sentry + a UI library + database client), the trace can exceed
default Node heap (~4 GB). Two levers:

1. **Bump Node heap.** In Docker: `ENV NODE_OPTIONS=--max-old-space-size=8192`
   on the builder stage (12288 for very large monorepos).
2. **Upgrade to alpha.7+.** Pre-alpha.7 had static top-level imports of both
   `react-reconciler-18` and `react-reconciler-19`, inflating every route's
   eager bundle. Alpha.7 switched to lazy `await import(...)` so the reconciler
   lives in an async chunk and per-route trace work shrinks significantly.
