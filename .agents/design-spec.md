# Fixture conversion - PURE TAILWIND

Each template in `packages/fixtures/src/<id>/index.tsx` was just redesigned to a
bold, modern look but uses inline `style={{}}` heavily. Your job: convert it to
**pure Tailwind** and fix anything broken. Keep the bold design; change how it's
expressed.

## THE RULE: no inline styles, ever

- **Zero `style={{...}}`.** Every colour, size, space, border, weight, radius,
  tracking, leading is a Tailwind class. No `style` prop on any element.
- Colours: Tailwind palette (`text-slate-900`, `bg-indigo-600`,
  `border-teal-700`, `text-emerald-600`, `bg-slate-50`, …). Pick ONE confident
  accent colour family for the doc and use it consistently. Only use an
  arbitrary value (`bg-[#0b1220]`, `text-[#b08d57]`) when no palette colour fits
  (e.g. a precise brand navy/gold).
- Sizes/space: `text-[11px]`, `w-[270px]`, `h-[18px]`, `px-16`, `py-3`, `gap-4`,
  `mt-2.5`, `tracking-[1.5pt]`, `leading-relaxed`, `rounded-md`,
  `border-l-[3px]`.
- The ONLY non-Tailwind allowed: the `<Page>` `size` / `sizeUnit` props (a prop,
  not a style) - keep `size="A4"`, landscape, or `size={[w,h]} sizeUnit="pt"`
  for fixed-size cards exactly as they are now.

## Fonts = Tailwind classes (theme is wired up)

`font-sans`→Inter, `font-serif`→Source Serif 4, `font-display`→Cormorant
Garamond, `font-mono`→JetBrains Mono, `font-script`→Pinyon Script. Set the base
on `<Page className="… font-sans …">` (it cascades) and override per element
(`className="font-display"`, `font-mono`, etc.). Use the families this doc was
assigned (keep whatever the current file uses, just expressed as classes instead
of `style={{ fontFamily: FONT.x }}`). You can delete the `FONT` import and the
colour-const declarations.

## Keep it simple - it's a sample, not a library

Write everything inline with Tailwind. Do NOT build prop-heavy helper
components. The only shared imports allowed (from `../components/index.js`):
`Table/Tr/Th/Td` (a row/cell helper - `Tr`/`Th`/`Td` take `className`),
`Eyebrow` (uppercase label, optional `className`), `Pill` (rounded badge,
`className` for colours), and `Barcode`/`QrCode`. The old kit (`KpiCard`,
`BrandMark`, `Callout`, `SectionTitle`, colour consts `INK`/`MUTED`/…) is GONE -
inline those as a few Tailwind divs (a KPI card is
`<div className="flex flex-col rounded-r border-l-[3px] border-indigo-600 bg-slate-50 px-4 py-3.5">…`;
a brand mark is two small offset `rounded-sm` coloured divs + a bold wordmark; a
callout is a tinted div with a left border). Remove any import of the deleted
names.

## Reference

`packages/fixtures/src/invoice/index.tsx` is the gold standard - already pure
Tailwind (font-sans, palette colours, inline brand mark + meta rows + total
block, zero `style`). Match its cleanliness.

## Don't reintroduce breakage

- No `<Svg src>` (renders blank). Charts/illustrations = divs.
- No Unicode glyphs the fallback font can't encode (✈ ● ◆ → ★). Use a small
  Tailwind div shape instead
  (`<div className="h-1.5 w-1.5 rotate-45 bg-indigo-600" />`).
- Content must fit its page(s); no overflow/overlap. Multi-page docs split
  across `<Page>`s.

## VERIFY (read-only, concurrency-safe)

`cd /Users/tamim/Documents/repos/imprint && pnpm --filter @imprint-pdf/fixtures exec tsc --noEmit`

- fix errors in YOUR file only (other files are mid-conversion by other agents,
  ignore their errors). Do NOT run `pnpm build` or the render script.
  Self-review for: any leftover `style={{}}`, any deleted-kit import, overflow,
  blank traps.

Return a 2-3 line summary.
