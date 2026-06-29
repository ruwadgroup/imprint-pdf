import { Document, Page } from '@imprint-pdf/react';
import { Eyebrow, Table, Td, Th, Tr } from '../components/index.js';
import type { DatasheetData } from './sample.js';

export type { DatasheetData, SpecRow } from './sample.js';
export { datasheetSample } from './sample.js';

export interface DatasheetProps {
  data: DatasheetData;
}

/**
 * Div-built "product" graphic - layered rounded coloured squares and circles in
 * an accent-tinted framed panel. No raw SVG (the node pipeline can't rasterise a
 * `<Svg src>` string and would render the whole page blank).
 */
function ProductGraphic() {
  return (
    <div className="relative h-[152px] w-[188px] items-center justify-center overflow-hidden rounded-2xl bg-blue-100">
      {/* offset accent backdrop slab */}
      <div className="absolute left-[56px] top-[14px] h-[118px] w-[118px] rounded-2xl bg-blue-300" />
      {/* main product body */}
      <div className="absolute left-[36px] top-[18px] h-[118px] w-[118px] items-center justify-center rounded-2xl bg-blue-600">
        {/* outer ring */}
        <div className="h-[78px] w-[78px] items-center justify-center rounded-full bg-blue-400">
          {/* driver cone */}
          <div className="h-[54px] w-[54px] items-center justify-center rounded-full bg-blue-700">
            <div className="h-[18px] w-[18px] rounded-full bg-white" />
          </div>
        </div>
      </div>
      {/* base accent bar */}
      <div className="absolute left-[67px] top-[130px] h-2 w-[56px] rounded-full bg-blue-700" />
    </div>
  );
}

export function Datasheet({ data }: DatasheetProps) {
  const half = Math.ceil(data.features.length / 2);
  const columns = [data.features.slice(0, half), data.features.slice(half)];

  return (
    <Document title={`${data.product} Datasheet`} author={data.product}>
      <Page size="A4" className="bg-white px-16 pb-14 pt-0 font-sans">
        {/* Full-bleed dark masthead with brand mark */}
        <div className="-mx-16 mb-12 flex h-[46px] flex-row items-center justify-between bg-slate-900 px-16">
          <div className="flex flex-row items-center gap-2">
            <div className="relative h-[18px] w-[18px]">
              <div className="absolute left-0 top-0 h-[13px] w-[13px] rounded-sm bg-blue-600" />
              <div className="absolute bottom-0 right-0 h-[13px] w-[13px] rounded-sm bg-slate-700" />
            </div>
            <span className="text-[12px] font-bold tracking-[-0.2pt] text-white">Sonance Labs</span>
          </div>
          <span className="text-[8px] font-semibold uppercase tracking-[2pt] text-slate-400">
            Product Datasheet
          </span>
        </div>

        {/* Hero: SKU eyebrow + BIG product name + tagline, div-built graphic right */}
        <div className="mb-12 flex flex-row items-center justify-between">
          <div className="flex flex-1 flex-col justify-center pr-10">
            <Eyebrow className="text-blue-600">{`${data.model} · Studio Series`}</Eyebrow>
            <h1 className="mt-2.5 text-[38px] font-bold leading-[1.02] tracking-[-1pt] text-slate-900">
              {data.product}
            </h1>
            <p className="mt-3 max-w-[320px] text-[12px] leading-relaxed text-slate-500">
              {data.tagline}
            </p>
          </div>
          <ProductGraphic />
        </div>

        {/* Key features: two-column accent-square bullet list with central gap */}
        <div className="mb-12 flex flex-col">
          <div className="mb-4 flex flex-row items-center gap-2">
            <div className="h-3.5 w-1 rounded-sm bg-blue-600" />
            <span className="text-[13px] font-bold tracking-[-0.2pt] text-slate-900">
              Key Features
            </span>
          </div>
          <div className="flex flex-row justify-between">
            {columns.map((col, c) => (
              <div key={c} className="flex w-[46%] flex-col">
                {col.map((feature, i) => (
                  <div key={i} className="mb-3.5 flex flex-row items-start">
                    <div className="mr-3 mt-[3px] h-[7px] w-[7px] rounded-[2px] bg-blue-600" />
                    <p className="flex-1 text-[10px] leading-relaxed text-slate-700">{feature}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Technical specifications: accent header, zebra, right-aligned values */}
        <div className="flex flex-col">
          <div className="mb-4 flex flex-row items-center gap-2">
            <div className="h-3.5 w-1 rounded-sm bg-blue-600" />
            <span className="text-[13px] font-bold tracking-[-0.2pt] text-slate-900">
              Technical Specifications
            </span>
          </div>
          <Table>
            <Tr className="rounded-t bg-blue-600 px-4">
              <Th flex>Specification</Th>
              <Th align="right" flex>
                Value
              </Th>
            </Tr>
            {data.specs.map((spec, i) => (
              <Tr
                key={i}
                className={`border-b border-slate-200 px-4 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}
              >
                <Td flex className="text-[10px] font-semibold text-slate-700">
                  {spec.key}
                </Td>
                <Td flex align="right" className="text-[10px] font-bold text-slate-900">
                  {spec.value}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="flex-1" />

        {/* Footer note */}
        <div className="mt-10 flex flex-row items-start gap-3 rounded-r border-l-[3px] border-blue-600 bg-slate-50 px-4 py-3">
          <div className="flex flex-col">
            <Eyebrow className="text-slate-400">Notes</Eyebrow>
            <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{data.footnote}</p>
          </div>
        </div>
      </Page>
    </Document>
  );
}
