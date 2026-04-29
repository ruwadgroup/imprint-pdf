# Philosophy

Imprint is built on one belief: **the way you style your web app is the way you
should style your PDFs**. Tailwind classes, React components, the same design
tokens. No parallel DSL to maintain, no subset table to memorise, no handoff
between "web dev" and "PDF generation."

Most PDF libraries treat PDF output as a separate discipline. You write a
stylesheet the library invented (`StyleSheet.create`), you learn what subset of
CSS it supports, and you maintain two styling systems forever.

We do it the other way. Your `tailwind.config.ts` IS the PDF styling system. The
Tailwind classes you already know produce exactly the CSS that produces exactly
the PDF layout. Move a component, rename a token, add a plugin — the PDF
follows.

## Why no Chromium

Chromium makes PDFs that look like screenshots of web pages. We make PDFs that
look like they were typeset.

Specifically:

- Chromium's line-breaker is greedy. Imprint uses Knuth–Plass — the same
  algorithm TeX uses. The difference is visible.
- Chromium cannot run on Cloudflare Workers or Vercel Edge Functions. A 200 MB
  binary does not run in a 128 MB Worker.
- Chromium cold-starts in 800–2,000 ms. Imprint cold-starts in 40–100 ms on the
  same edge infrastructure.
- PDF/X-4, CMYK, spot colors, bleed, and registration marks are not Chromium
  features. Commercial printers need those.

The constraint "no Chromium, ever" is a feature, not a limitation.

## Why real Tailwind

`react-pdf-tailwind` is a class-to-StyleSheet translator. `react-pdf-renderer`
is a DSL with a Tailwind skin. Both are a "compatible subset" that breaks the
moment you use a plugin, an arbitrary value, a custom theme token, or `@screen`.

We ship the actual Tailwind v4 Oxide compiler as WASM. Your plugins run. Your
`@theme` tokens resolve. `text-[oklch(60%_0.15_230)]` works. `mt-[3.7mm]` works.
The CSS printed-page `@page` variants work.

The only classes that are "unsupported" are ones whose CSS properties have no
PDF analogue — `position: sticky`, `transition-*`, `:hover`. Those are silently
dropped (or surfaced as warnings in strict mode) because they don't have an
output, not because we failed to implement them.

## Why Taffy over Yoga

Yoga is a solid Flexbox implementation. It is also _only_ Flexbox. If you want
CSS Grid — the layout model that half of modern web UI uses — Yoga cannot help
you. `@react-pdf/renderer` cannot help you. Satori cannot help you.

Taffy (Rust, MIT) is the only production-grade open layout engine that ships
Block + Flexbox + CSS Grid today. It powers Bevy, Dioxus, and Zed. We compile it
to WASM and the whole `grid-cols-12` family just works.

## Why Knuth–Plass by default

Greedy line breaking is fast. It is also ugly. Rivers of white space in
justified text, bad breaks in ragged text, widows on every chapter page.

Knuth–Plass dynamic-programming justification runs globally over a paragraph and
produces measurably better output. It is `O(n)` practical with a cutoff and
benchmarks at under 1 ms per paragraph. The quality is the brand promise. We
don't let users opt into worse output by default.

## Open core and BSL

The Apache-2.0 core (`@imprint/core`, `@imprint/react`, `@imprint/tailwind`,
`@imprint/cli`, `@imprint/next`, `@imprint/vite`, `@imprint/eslint-plugin`)
exists to get PDF generation right in the hands of every JavaScript developer,
no purchase required.

The BSL enterprise packages (`@imprint/print`, `@imprint/sign`, `@imprint/ua`)
exist because regulated enterprises — print shops, fintech, healthcare, EU EAA
compliance — need PDF/X, PDF/UA, PKCS#7 signatures, and someone to call when
something breaks. BSL 1.1 prevents cloud vendors from reselling Imprint as a
managed service without contributing back; it reverts to Apache-2.0 after four
years.

If something here is wrong for you,
[open an issue](https://github.com/tamimbinhakim/imprint/issues). The commercial
terms bend; the technical philosophy stays.
