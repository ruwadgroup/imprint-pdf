import { Document, Page, Signature } from '@imprint-pdf/react/standalone';
import type { ContractData, ContractParty } from './sample.js';

export type { ContractClause, ContractData, ContractParty } from './sample.js';
export { contractSample } from './sample.js';

export interface ContractProps {
  data: ContractData;
}

function PartyBlock({ party }: { party: ContractParty }) {
  return (
    <div className="flex flex-col flex-1">
      <span className="text-[10px] font-bold uppercase tracking-[1.5pt] text-slate-500">
        {party.role}
      </span>
      <p className="mt-1 text-sm font-bold text-slate-900">{party.entity}</p>
      <p className="text-xs text-slate-700">By: {party.name}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{party.address}</p>
    </div>
  );
}

export function Contract({ data }: ContractProps) {
  return (
    <Document title={data.title} author={data.partyA.entity}>
      <Page size="A4" className="bg-white px-16 py-14 font-serif text-slate-900">
        <div className="flex flex-col items-center border-b-2 border-slate-900 pb-5">
          <h1 className="text-center text-2xl font-bold tracking-[1pt]">{data.title}</h1>
          <p className="mt-2 text-xs text-slate-600">Effective as of {data.effectiveDate}</p>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate-800">
          This {data.title} (this "Agreement") is entered into as of {data.effectiveDate} (the
          "Effective Date") by and between {data.partyA.entity} ("{data.partyA.role}") and{' '}
          {data.partyB.entity} ("{data.partyB.role}"), each a "Party" and together the "Parties."
        </p>

        <div className="mt-5 flex flex-row gap-8">
          <PartyBlock party={data.partyA} />
          <PartyBlock party={data.partyB} />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {data.recitals.map((line, i) => (
            <p key={i} className="text-xs italic leading-relaxed text-slate-700">
              {line}
            </p>
          ))}
        </div>

        <ol className="mt-6 flex flex-col gap-4">
          {data.clauses.map((clause, i) => (
            <li key={i} className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-900">
                {i + 1}. {clause.heading}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-800 text-justify">
                {clause.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 border-t border-slate-300 pt-4">
          <span className="text-[10px] font-bold uppercase tracking-[1.5pt] text-slate-500">
            Recitals & Notes
          </span>
          <ol className="mt-2 flex flex-col gap-1">
            {data.footnotes.map((note, i) => (
              <li key={i} className="flex flex-row">
                <span className="mr-2 text-[9px] text-slate-400">{i + 1}.</span>
                <p className="flex-1 text-[9px] leading-snug text-slate-500">{note}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-col">
          <p className="text-xs leading-relaxed text-slate-800">
            IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date,
            at {data.signedAt}, intending to be legally bound, under the laws of {data.governingLaw}
            .
          </p>

          <div className="mt-8 flex flex-row gap-12">
            <div className="flex flex-1 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[1.5pt] text-slate-500">
                {data.partyA.role}
              </span>
              <Signature
                name="party_a_sig"
                className="mt-2 h-16 w-full border-b border-slate-400"
              />
              <p className="mt-1 text-xs font-semibold text-slate-900">{data.partyA.name}</p>
              <p className="text-[10px] text-slate-600">{data.partyA.entity}</p>
              <div className="mt-4 flex flex-col">
                <div className="h-5 border-b border-slate-400" />
                <span className="mt-1 text-[10px] text-slate-500">Date</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[1.5pt] text-slate-500">
                {data.partyB.role}
              </span>
              <Signature
                name="party_b_sig"
                className="mt-2 h-16 w-full border-b border-slate-400"
              />
              <p className="mt-1 text-xs font-semibold text-slate-900">{data.partyB.name}</p>
              <p className="text-[10px] text-slate-600">{data.partyB.entity}</p>
              <div className="mt-4 flex flex-col">
                <div className="h-5 border-b border-slate-400" />
                <span className="mt-1 text-[10px] text-slate-500">Date</span>
              </div>
            </div>
          </div>
        </div>
      </Page>
    </Document>
  );
}
