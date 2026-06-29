import { Document, Page } from '@imprint-pdf/react/standalone';
import { Table, Td, Th, Tr } from '../components/Table.js';
import type { DatasheetData } from './sample.js';

export type { DatasheetData, SpecRow } from './sample.js';
export { datasheetSample } from './sample.js';

export interface DatasheetProps {
  data: DatasheetData;
}

export function Datasheet({ data }: DatasheetProps) {
  return (
    <Document title={`${data.product} Datasheet`} author={data.product}>
      <Page size="A4" className="bg-white px-14 py-12 font-sans text-slate-900">
        <div className="flex flex-row justify-between items-start mb-10">
          <div className="flex flex-col flex-1 pr-8">
            <span className="text-xs font-bold text-sky-600 tracking-[2pt]">{data.model}</span>
            <h1 className="text-4xl font-bold text-slate-900 mt-1">{data.product}</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{data.tagline}</p>
          </div>
          <div
            className="flex items-center justify-center bg-slate-100 rounded-xl"
            style={{ width: 156, height: 126 }}
          >
            <span className="text-5xl font-bold text-sky-600">{data.product.charAt(0)}</span>
          </div>
        </div>

        <div className="flex flex-col mb-10">
          <span className="text-xs font-bold text-slate-400 tracking-[1pt] mb-3">KEY FEATURES</span>
          <div className="flex flex-row flex-wrap">
            {data.features.map((feature, i) => (
              <div key={i} className="flex flex-row items-start" style={{ width: '50%' }}>
                <div
                  className="bg-sky-500 rounded-full mt-1.5 mr-2"
                  style={{ width: 6, height: 6 }}
                />
                <p className="text-xs text-slate-700 leading-relaxed flex-1 pr-4 mb-3">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 tracking-[1pt] mb-3">
            TECHNICAL SPECIFICATIONS
          </span>
          <Table>
            <Tr className="bg-slate-800 rounded-t px-4">
              <Th flex>Specification</Th>
              <Th align="right" flex>
                Value
              </Th>
            </Tr>
            {data.specs.map((spec, i) => (
              <Tr key={i} className={`px-4 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
                <Td flex>
                  <span className="text-xs font-semibold text-slate-600">{spec.key}</span>
                </Td>
                <Td flex align="right">
                  {spec.value}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="flex-1" />
        <div className="border-t border-slate-200 pt-4 mt-8">
          <p className="text-[10px] text-slate-400 leading-relaxed">{data.footnote}</p>
        </div>
      </Page>
    </Document>
  );
}
