# FAQ

## Does Imprint support every Tailwind class?

Almost. The actual Tailwind v4 Oxide compiler runs, so your plugins, arbitrary
values, `@theme` tokens, and custom variants all work. What's dropped are CSS
properties that have no PDF output: `hover:`, `focus:`, `transition-*`,
`animation-*`, `position: sticky`, `position: fixed`, `overflow: auto`.

Pass `{ strict: true }` to `renderToBuffer` to get warnings for dropped
properties instead of silent drops.

## What's the difference between `@imprint/react` and `@react-pdf/renderer`?

The main differences:

- **Tailwind.** Imprint uses the real Tailwind v4 compiler;
  `@react-pdf/renderer` uses a hand-curated `StyleSheet` DSL that supports a
  subset of CSS.
- **CSS Grid.** Imprint (via Taffy) supports `display: grid`.
  `@react-pdf/renderer` (via Yoga) only has Flexbox.
- **Typography.** Imprint uses HarfBuzz for shaping and Knuth–Plass for
  justification. `@react-pdf/renderer` uses fontkit-only shaping with greedy
  line breaking.
- **AcroForms.** Imprint has `<TextField>`, `<Signature>`, etc.
  `@react-pdf/renderer` has no form authoring.
- **Edge runtime.** Imprint runs on Cloudflare Workers; `@react-pdf/renderer` is
  incompatible with edge runtimes.

## Can I share my Tailwind config between web and PDF?

Yes — and you usually don't have to wire it up at all. Imprint runs Tailwind v4,
which is configured CSS-first, and auto-detects your stylesheet from
`src/app.css`, `src/globals.css`, `app/globals.css`, and similar conventional
locations. The same `app.css` your web app uses gives Imprint your colors,
spacing, fonts, plugins, and `@theme` tokens for free.

If your CSS entry lives somewhere unusual, point Imprint at it explicitly:

```ts
imprintTailwind({ stylesheet: './src/styles/pdf.css' });
```

If you still have a Tailwind v3 `tailwind.config.ts`, reference it from your CSS
via `@config './tailwind.config.ts';` — Tailwind v4 reads it as a compatibility
shim. See the
[Tailwind config integration guide](integrations/tailwind-config.md).

## Does it run in the browser?

Yes. The default build works in modern browsers with WASM support. Bundle size
is ~800 KB gzipped. Use subpath imports to tree-shake features you don't need.

## Does it support Arabic, Hindi, Thai, CJK?

Yes. HarfBuzz + ICU4X handle bidirectional text, complex script shaping (Arabic
Nastaliq, Devanagari, Thai, CJK), GSUB/GPOS kerning, and ligatures. You need to
supply a font that covers the script; subsetting handles the rest. Enable
language-specific hyphenation via the `hyphenation` config option.

## Can I use custom fonts?

Yes. Point `fonts` in `imprint.config.ts` at local `.woff2`, `.otf`, or `.ttf`
files. Google Fonts and Bunny Fonts are supported via URL. Variable fonts work;
provide the `axes` you want to use.

## Is it really faster than Puppeteer?

On cold starts, yes, by 10–20×. Chromium cold-starts take 800–2,000 ms. Imprint
cold-starts in 40–100 ms on Cloudflare Workers.

On warm throughput for complex documents with lots of JavaScript, Chromium can
be faster — it has a JIT for the rendering engine. Imprint's sweet spot is paged
documents authored as React components, not converted web pages.

## What's the licensing for the enterprise packages?

Apache-2.0, like the rest of the project. There's no time-bombed source and no
commercial seat requirement — `@imprint/print`, `@imprint/sign`, and
`@imprint/ua` ship under the same license as the engine. See
[`LICENSING.md`](../LICENSING.md) for the full list and sponsorship contact.

## Does Imprint render existing HTML or web pages?

No. Imprint renders React component trees authored specifically for PDF output.
It is not a "screenshot this URL" tool — use Puppeteer for that. Imprint is the
right tool when you own the template and want it to look good.

## How do I add a watermark / background to every page?

Use `<Page className="relative">` and add an absolutely-positioned `<div>` as
the first child. Absolute positioning inside `<Page>` uses the page coordinate
system.

## Can I generate a PDF/A file for archiving?

PDF/A-2b and PDF/A-3 are provided by `@imprint/print`. PDF/A-3 supports embedded
attachments — used for factur-X and ZUGFeRD e-invoicing.

## How does streaming work?

`renderToStream` returns a `ReadableStream<Uint8Array>` that emits one chunk per
page. The first byte arrives in <50 ms for most documents. Pipe it directly into
a `Response` object in Cloudflare Workers or Vercel Edge Functions.
