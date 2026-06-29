import { Document, Page } from '@imprint-pdf/react/standalone';
import type { CoverLetterData } from './sample.js';

export type { CoverLetterData } from './sample.js';
export { coverLetterSample } from './sample.js';

export interface CoverLetterProps {
  data: CoverLetterData;
}

export function CoverLetter({ data }: CoverLetterProps) {
  return (
    <Document title={`Cover Letter - ${data.sender.name}`} author={data.sender.name}>
      <Page size="A4" className="bg-white px-16 py-14 font-serif text-slate-900">
        <div className="flex flex-row justify-between items-end border-b-2 border-slate-800 pb-4 mb-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{data.sender.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{data.sender.title}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs text-slate-500">{data.sender.email}</p>
            <p className="text-xs text-slate-500 mt-0.5">{data.sender.phone}</p>
            <p className="text-xs text-slate-500 mt-0.5">{data.sender.location}</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-8">{data.date}</p>

        <div className="flex flex-col mb-8">
          <p className="text-sm font-semibold text-slate-900">{data.recipient.name}</p>
          <p className="text-sm text-slate-700 mt-0.5">{data.recipient.title}</p>
          <p className="text-sm text-slate-700 mt-0.5">{data.recipient.company}</p>
          <p className="text-sm text-slate-700 mt-0.5">{data.recipient.address}</p>
        </div>

        <p className="text-sm text-slate-900 mb-6">{data.salutation}</p>

        <div className="flex flex-col">
          {data.paragraphs.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-pretty text-slate-800 mb-5">
              {para}
            </p>
          ))}
        </div>

        <div className="flex flex-col mt-6">
          <p className="text-sm text-slate-900 mb-10">{data.closing}</p>
          <p className="text-lg font-semibold text-slate-900">{data.sender.name}</p>
          <p className="text-xs text-slate-500 mt-1">{data.sender.title}</p>
        </div>
      </Page>
    </Document>
  );
}
