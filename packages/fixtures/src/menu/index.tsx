import { Document, Page } from '@imprint-pdf/react/standalone';
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
      <div className="flex flex-row items-end">
        <span className="text-sm font-semibold text-stone-900">{item.name}</span>
        <div className="mx-2 flex-1 border-b border-dotted border-stone-400" />
        <span className="text-sm font-semibold text-stone-900">{money(item.price)}</span>
      </div>
      <p className="mt-0.5 text-xs italic leading-snug text-stone-500">{item.description}</p>
    </div>
  );
}

function Section({ section }: { section: MenuSection }) {
  return (
    <div className="mb-6 flex flex-col">
      <h2 className="mb-3 border-b border-stone-900 pb-1 text-base font-bold uppercase tracking-[2pt] text-stone-900">
        {section.title}
      </h2>
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
      <Page size="A4" className="bg-stone-50 px-16 py-14 font-serif text-stone-900">
        <div className="flex flex-col items-center border-b-2 border-stone-900 pb-6">
          <h1 className="text-center text-4xl font-bold tracking-[4pt] text-stone-900">
            {data.name}
          </h1>
          <p className="mt-3 text-center text-sm italic text-stone-600">{data.tagline}</p>
          <p className="mt-1 text-center text-[10px] uppercase tracking-[2pt] text-stone-500">
            {data.location}
          </p>
        </div>

        <div className="mt-8 flex flex-row gap-12">
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
        <div className="mt-8 border-t border-stone-300 pt-4">
          <p className="text-center text-[10px] italic leading-relaxed text-stone-500">
            {data.footer}
          </p>
        </div>
      </Page>
    </Document>
  );
}
