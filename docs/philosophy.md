# Philosophy

One belief: **the way you style your web app is the way you should style your
PDFs**. Tailwind classes, React components, the same design tokens. No parallel
DSL, no subset table, no handoff between "web dev" and "PDF generation."

Most PDF libraries treat PDF as a separate discipline. You learn their
`StyleSheet.create` DSL, find out what CSS subset they support, and maintain two
styling systems forever.

Your Tailwind v4 stylesheet — `app.css` with `@theme` and `@plugin` — IS the PDF
styling system. Move a component, rename a token, add a plugin — the PDF
follows.

## Why no Chromium

Chromium makes PDFs that look like screenshots of web pages. imprint-pdf makes
PDFs that look like they were typeset.

- Chromium's line-breaker is greedy. imprint-pdf uses Knuth–Plass, the same
  algorithm TeX uses. The difference is visible.
- A 200 MB binary does not run in a 128 MB Cloudflare Worker.
- Chromium cold-starts in 800–2,000 ms. imprint-pdf cold-starts in 40–100 ms on
  the same infrastructure.
- PDF/X-4, CMYK, spot colors, bleed, and registration marks aren't Chromium
  features. Commercial printers need them.

"No Chromium, ever" is a feature, not a limitation.

## Why real Tailwind

`react-pdf-tailwind` is a class-to-StyleSheet translator. `react-pdf-renderer`
is a DSL with a Tailwind skin. Both ship a "compatible subset" that breaks the
moment you use a plugin, an arbitrary value, a custom theme token, or `@screen`.

imprint-pdf ships the actual Tailwind v4 Oxide compiler as WASM. Your plugins
run. Your `@theme` tokens resolve. `text-[oklch(60%_0.15_230)]` works.
`mt-[3.7mm]` works. The CSS printed-page `@page` variants work.

The only "unsupported" classes are ones whose CSS properties have no PDF
analogue — `position: sticky`, `transition-*`, `:hover`. Those drop silently (or
warn in strict mode) because there's nothing to output, not because we gave up.

## Why Taffy over Yoga

Yoga is a solid Flexbox implementation. It is also _only_ Flexbox. CSS Grid —
the layout half of modern web UI runs on — is not on the table. Neither
`@react-pdf/renderer` nor Satori can do Grid.

Taffy (Rust, MIT) is the only production-grade open layout engine that ships
Block + Flexbox + CSS Grid today. It powers Bevy, Dioxus, and Zed. Compiled to
WASM, the whole `grid-cols-12` family just works.

## Why Knuth–Plass by default

Greedy line breaking is fast. It is also ugly: rivers of white space in
justified text, bad breaks in ragged text, widows on every chapter page.

Knuth–Plass runs globally over a paragraph and produces measurably better
output. It's `O(n)` practical with a cutoff and benchmarks under 1 ms per
paragraph. Quality is the brand promise — opting into worse output by default
would be silly.

## One license, no surprises

Every package is Apache-2.0. The engine (`@imprint-pdf/core`,
`@imprint-pdf/react`, `@imprint-pdf/cli`, `@imprint-pdf/next`,
`@imprint-pdf/vite`, `@imprint-pdf/eslint`) and the compliance + print add-ons
(`@imprint-pdf/print`, `@imprint-pdf/sign`, `@imprint-pdf/ua`) all ship under
the same license — no time-bombed source, no commercial seat requirement, no
friction for production.

Why not BSL or open-core? It makes the Apache-2.0 surface feel partial and the
BSL surface feel hostile. Print shops, fintech, healthcare, EU EAA compliance —
they need PDF/X, PDF/UA, and PKCS#7 signatures and shouldn't pay a license tax
to get them. Sponsorship and paid support fund the work instead.

If something here is wrong for you,
[open an issue](https://github.com/tamimbinhakim/imprint-pdf/issues).
