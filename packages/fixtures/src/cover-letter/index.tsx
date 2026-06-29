import { Document, Page } from '@imprint-pdf/react';
import type { CoverLetterData } from './sample.js';

export type { CoverLetterData } from './sample.js';
export { coverLetterSample } from './sample.js';

export interface CoverLetterProps {
  data: CoverLetterData;
}

/** Monogram: initials in a small filled navy square - a quiet, designed mark. */
function Monogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return (
    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[5px] bg-blue-900">
      <span className="font-sans text-[15px] font-bold tracking-[0.5pt] text-white">
        {initials}
      </span>
    </div>
  );
}

export function CoverLetter({ data }: CoverLetterProps) {
  return (
    <Document title={`Cover Letter - ${data.sender.name}`} author={data.sender.name}>
      <Page size="A4" className="bg-white px-20 pb-16 pt-0 font-serif text-stone-900">
        {/* Letterhead band */}
        <header className="mt-16">
          <div className="flex flex-row items-start justify-between">
            {/* Left: monogram + name + title eyebrow */}
            <div className="flex flex-row items-center gap-3.5">
              <Monogram name={data.sender.name} />
              <div className="flex flex-col">
                <h1 className="font-sans text-[26px] font-bold leading-none tracking-[-0.5pt] text-stone-900">
                  {data.sender.name}
                </h1>
                <span className="mt-2 font-sans text-[8.5px] font-semibold uppercase tracking-[2.5pt] text-blue-900">
                  {data.sender.title}
                </span>
              </div>
            </div>
            {/* Right: contact details */}
            <div className="flex flex-col items-end gap-1 pt-1">
              <span className="font-sans text-[8.5px] tracking-[0.3pt] text-stone-900">
                {data.sender.email}
              </span>
              <span className="font-sans text-[8.5px] tracking-[0.3pt] text-stone-600">
                {data.sender.phone}
              </span>
              <span className="font-sans text-[8.5px] tracking-[0.3pt] text-stone-600">
                {data.sender.location}
              </span>
            </div>
          </div>
          {/* Confident accent rule: thick navy segment over a full hairline */}
          <div className="relative mt-5">
            <div className="h-px w-full bg-stone-200" />
            <div className="absolute left-0 top-0 h-[2.5px] w-16 bg-blue-900" />
          </div>
        </header>

        {/* Date */}
        <p className="mt-11 text-[10.5px] text-stone-600">{data.date}</p>

        {/* Recipient address block */}
        <div className="mt-7 flex flex-col">
          <span className="mb-2 font-sans text-[8px] font-semibold uppercase tracking-[2pt] text-stone-400">
            Addressed to
          </span>
          <p className="text-[11px] font-semibold text-stone-900">{data.recipient.name}</p>
          <p className="mt-0.5 text-[11px] text-stone-600">{data.recipient.title}</p>
          <p className="text-[11px] text-stone-600">{data.recipient.company}</p>
          <p className="mt-0.5 max-w-[300px] text-[11px] leading-relaxed text-stone-600">
            {data.recipient.address}
          </p>
        </div>

        {/* Salutation */}
        <p className="mt-9 text-[11px] text-stone-900">{data.salutation}</p>

        {/* Body */}
        <div className="mt-4 flex flex-col gap-4">
          {data.paragraphs.map((para, i) => (
            <p key={i} className="text-[11px] leading-relaxed text-pretty text-stone-900">
              {para}
            </p>
          ))}
        </div>

        {/* Closing + signature */}
        <div className="mt-9 flex flex-col items-start">
          <p className="text-[11px] text-stone-900">{data.closing}</p>
          <p className="mt-7 text-[22px] font-semibold italic leading-none tracking-[-0.2pt] text-blue-900">
            {data.sender.name}
          </p>
          <div className="mb-2 mt-3 h-[1.5px] w-12 bg-blue-900" />
          <p className="font-sans text-[8px] font-semibold uppercase tracking-[2pt] text-stone-400">
            {data.sender.title}
          </p>
        </div>
      </Page>
    </Document>
  );
}
