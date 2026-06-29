import { Document, Page, Watermark } from '@imprint-pdf/react';
import type { CertificateData } from './sample.js';

export type { CertificateData } from './sample.js';
export { certificateSample } from './sample.js';

export interface CertificateProps {
  data: CertificateData;
}

function Seal() {
  return (
    <div
      className="flex items-center justify-center rounded-full border-4 border-indigo-600 bg-indigo-50"
      style={{ width: 72, height: 72 }}
    >
      <div
        className="flex items-center justify-center rounded-full border border-indigo-300 bg-indigo-600"
        style={{ width: 44, height: 44 }}
      >
        <span className="text-xl font-bold text-white">*</span>
      </div>
    </div>
  );
}

export function Certificate({ data }: CertificateProps) {
  const [left, right] = data.signatories;
  return (
    <Document title={data.title} author={data.organization}>
      <Page size="A4" orientation="landscape" className="bg-white p-6 font-serif text-slate-900">
        <Watermark className="text-slate-100 font-bold tracking-[8pt]" style={{ fontSize: 120 }}>
          CERTIFIED
        </Watermark>

        <div className="flex flex-col flex-1 border-4 border-indigo-600 p-2">
          <div className="flex flex-col flex-1 border border-indigo-300 px-16 py-10 items-center justify-between">
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold tracking-[3pt] text-indigo-600 uppercase">
                {data.organization}
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-800 mt-4">
                {data.title}
              </h1>
              <div className="bg-indigo-600 mt-4" style={{ width: 80, height: 3 }} />
            </div>

            <div className="flex flex-col items-center">
              <p className="text-sm text-slate-500 mb-3">{data.preamble}</p>
              <p className="text-5xl font-bold text-indigo-700" style={{ fontFamily: 'serif' }}>
                {data.recipient}
              </p>
              <p
                className="text-sm leading-relaxed text-pretty text-slate-600 text-center mt-4"
                style={{ maxWidth: 460 }}
              >
                {data.description}
              </p>
            </div>

            <div className="flex flex-row items-end justify-between w-full mt-6">
              <div className="flex flex-col items-center" style={{ width: 200 }}>
                <p className="text-lg font-semibold text-slate-800">{left?.name}</p>
                <div className="border-t border-slate-400 w-full mt-1 pt-1" />
                <p className="text-xs text-slate-500">{left?.role}</p>
              </div>

              <div className="flex flex-col items-center">
                <Seal />
                <p className="text-xs text-slate-400 mt-1">{data.date}</p>
                <p className="text-xs text-slate-400 mt-0.5">No. {data.certificateId}</p>
              </div>

              <div className="flex flex-col items-center" style={{ width: 200 }}>
                <p className="text-lg font-semibold text-slate-800">{right?.name}</p>
                <div className="border-t border-slate-400 w-full mt-1 pt-1" />
                <p className="text-xs text-slate-500">{right?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </Page>
    </Document>
  );
}
