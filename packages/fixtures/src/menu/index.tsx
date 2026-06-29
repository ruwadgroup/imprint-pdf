import { Document, Page } from '@imprint-pdf/react';
import { money } from '../lib/format.js';
import type { MenuData, MenuItem, MenuSection } from './sample.js';

export type { MenuData, MenuItem, MenuSection } from './sample.js';
export { menuSample } from './sample.js';

export interface MenuProps {
  data: MenuData;
}

function Item({ item }: { item: MenuItem }) {
  return (
    <div className="mb-4 flex flex-col">
      {/* Name · dotted leader · price all share one baseline. The leader is a
          dotted underline on a flexible filler span, so it tracks the text
          baseline rather than floating above the descenders. */}
      <div className="flex flex-row items-baseline">
        <span className="font-serif text-base font-semibold tracking-[0.15pt] text-[#1c1917]">
          {item.name}
        </span>
        <span className="mx-2 flex-1 -translate-y-[1px] self-baseline border-b border-dotted border-[#a8a29e]" />
        <span className="font-display text-base font-semibold tracking-[0.4pt] text-[#7c6f3f]">
          {money(item.price)}
        </span>
      </div>
      <p className="mt-1 max-w-[235px] font-serif text-xs italic leading-snug text-[#78716c]">
        {item.description}
      </p>
    </div>
  );
}

function Section({ section }: { section: MenuSection }) {
  return (
    <div className="mb-8 flex flex-col">
      <div className="mb-4 flex flex-row items-center">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[3.5pt] text-[#1c1917]">
          {section.title}
        </h2>
        <div className="ml-3.5 flex flex-1 flex-row items-center gap-2.5">
          <div className="h-px flex-1 bg-[#d8d2c6]" />
          <div className="h-[4px] w-[4px] rotate-45 bg-[#7c6f3f]" />
        </div>
      </div>
      {section.items.map((item, i) => (
        <Item key={i} item={item} />
      ))}
    </div>
  );
}

export function Menu({ data }: MenuProps) {
  const left = data.sections.filter((_, i) => i % 2 === 0);
  const right = data.sections.filter((_, i) => i % 2 === 1);
  return (
    <Document title={data.name} author={data.name}>
      <Page size="A4" className="bg-white px-16 pb-14 pt-12 font-serif text-[#1c1917]">
        {/* Masthead: ornament, large Cormorant name, italic tagline, letterspaced
            caps address/hours, all centered within a hairline frame. */}
        <div className="flex flex-col items-center">
          <div className="flex flex-row items-center gap-2.5">
            <div className="h-px w-9 bg-[#7c6f3f]" />
            <div className="h-[5px] w-[5px] rotate-45 bg-[#7c6f3f]" />
            <div className="h-px w-9 bg-[#7c6f3f]" />
          </div>
          <h1 className="mt-5 text-center font-display text-5xl font-bold leading-none tracking-[1.5pt] text-[#1c1917]">
            {data.name}
          </h1>
          <p className="mt-3 text-center font-display text-base font-semibold italic text-[#78716c]">
            {data.tagline}
          </p>
          <p className="mt-4 text-center font-serif text-2xs font-semibold uppercase tracking-[2.8pt] text-[#a8a29e]">
            {data.location}
          </p>
          <div className="mt-5 h-px w-full bg-[#d8d2c6]" />
        </div>

        <div className="mt-10 flex flex-row gap-12">
          <div className="flex flex-1 flex-col">
            {left.map((section, i) => (
              <Section key={i} section={section} />
            ))}
          </div>
          <div className="flex flex-1 flex-col">
            {right.map((section, i) => (
              <Section key={i} section={section} />
            ))}
          </div>
        </div>

        <div className="flex-1" />
        <div className="mt-6 flex flex-col items-center">
          <div className="flex flex-row items-center gap-2.5">
            <div className="h-px w-9 bg-[#d8d2c6]" />
            <div className="h-[4px] w-[4px] rotate-45 bg-[#a8a29e]" />
            <div className="h-px w-9 bg-[#d8d2c6]" />
          </div>
          <p className="mt-4 max-w-[400px] text-center font-serif text-xs italic leading-relaxed text-[#a8a29e]">
            {data.footer}
          </p>
        </div>
      </Page>
    </Document>
  );
}
