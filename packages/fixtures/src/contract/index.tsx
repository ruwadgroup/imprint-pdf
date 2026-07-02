import {
  Document,
  Footer,
  Header,
  Page,
  PageNumber,
  Signature,
  TotalPages,
} from '@imprint-pdf/react';
import type { ContractClause, ContractData, ContractParty } from './sample.js';

export type { ContractClause, ContractData, ContractParty } from './sample.js';
export { contractSample } from './sample.js';

export interface ContractProps {
  data: ContractData;
}

/** Bordered party card - role caption (sans) over entity + signatory + address. */
function PartyCard({ party }: { party: ContractParty }) {
  return (
    <div className="flex flex-1 flex-col rounded border border-slate-200 bg-slate-50 px-4 py-3.5">
      <span className="font-sans text-2xs font-semibold uppercase tracking-[2pt] text-[#1e3a5f]">
        {party.role}
      </span>
      <p className="mt-2 text-base font-bold text-slate-900">{party.entity}</p>
      <p className="mt-0.5 text-sm text-slate-600">By: {party.name}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{party.address}</p>
    </div>
  );
}

/** Numbered clause: accent number + bold sans heading, justified serif body. */
function Clause({ index, clause }: { index: number; clause: ContractClause }) {
  return (
    <li className="mb-3.5 flex flex-row gap-2.5 break-inside-avoid">
      {/* Accent index in its own column so the heading stays on one line. */}
      <span className="w-4 font-sans text-sm font-bold tracking-[-0.1pt] text-[#1e3a5f]">
        {index}.
      </span>
      <div className="flex flex-1 flex-col">
        <h2 className="font-sans text-sm font-bold tracking-[-0.1pt] text-slate-900">
          {clause.heading}
        </h2>
        <p className="mt-1 text-justify text-sm leading-[1.55] text-slate-700">{clause.body}</p>
      </div>
    </li>
  );
}

/** Signature column - ruled line via Signature, role caption, name, date line. */
function SignatureColumn({ party, name }: { party: ContractParty; name: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <span className="font-sans text-2xs font-semibold uppercase tracking-[2pt] text-[#1e3a5f]">
        {party.role}
      </span>
      <Signature name={name} className="mt-2 h-14 w-full border-b border-slate-900" />
      <p className="mt-1.5 text-sm font-bold text-slate-900">{party.name}</p>
      <p className="text-xs text-slate-600">{party.entity}</p>
      <div className="mt-5 flex flex-col">
        <div className="h-5 border-b border-slate-900" />
        <span className="mt-1.5 font-sans text-2xs font-semibold uppercase tracking-[2pt] text-slate-400">
          Date
        </span>
      </div>
    </div>
  );
}

export function Contract({ data }: ContractProps) {
  // Clauses flow onto as many pages as they need - the renderer paginates
  // automatically, repeating the running header rule and footer per page.
  return (
    <Document title={data.title} author={data.partyA.entity}>
      <Page size="A4" className="bg-white px-16 pb-16 pt-12 font-serif text-slate-900">
        {/* Full-bleed accent rule at the very top of every page. */}
        <Header>
          <div className="h-2 w-full bg-[#1e3a5f]" />
        </Header>

        {/* Running footer with live page numbers. */}
        <Footer>
          <div className="flex flex-row justify-between border-t border-slate-200 px-16 pb-8 pt-3">
            <span className="font-sans text-2xs font-semibold uppercase tracking-[2pt] text-slate-400">
              {data.title}
            </span>
            <span className="font-sans text-2xs font-semibold uppercase tracking-[2pt] text-slate-400">
              Page <PageNumber /> of <TotalPages />
            </span>
          </div>
        </Footer>

        {/* Confident title block. */}
        <div className="flex flex-col">
          <span className="font-sans text-2xs font-semibold uppercase tracking-[2pt] text-[#1e3a5f]">
            Confidential
          </span>
          <h1 className="mt-2.5 font-sans text-3xl font-bold leading-[1.05] tracking-[-0.3pt] text-slate-900">
            {data.title}
          </h1>
          <div className="mt-4 flex flex-row items-center gap-3">
            <div className="h-[3px] w-12 bg-[#1e3a5f]" />
            <span className="font-sans text-xs font-semibold uppercase tracking-[2pt] text-slate-600">
              Effective {data.effectiveDate}
            </span>
          </div>
        </div>

        {/* Recital intro - plain flowing serif (no inline spans: imprint breaks them). */}
        <p className="mt-8 text-justify text-sm leading-[1.6] text-slate-700">
          This {data.title} (this &ldquo;Agreement&rdquo;) is entered into as of{' '}
          {data.effectiveDate} (the &ldquo;Effective Date&rdquo;) by and between{' '}
          {data.partyA.entity} (the &ldquo;{data.partyA.role}&rdquo;) and {data.partyB.entity} (the
          &ldquo;{data.partyB.role}&rdquo;), each a &ldquo;Party&rdquo; and together the
          &ldquo;Parties.&rdquo;
        </p>

        {/* Two-party cards. */}
        <div className="mt-6 flex flex-row gap-4">
          <PartyCard party={data.partyA} />
          <PartyCard party={data.partyB} />
        </div>

        {/* Recitals. */}
        <div className="mt-6 flex flex-col gap-1.5">
          {data.recitals.map((line, i) => (
            <p key={i} className="text-justify text-xs italic leading-[1.5] text-slate-600">
              {line}
            </p>
          ))}
        </div>

        {/* Clauses - the full run, flowing across pages. */}
        <ol className="mt-6 flex flex-col">
          {data.clauses.map((clause, i) => (
            <Clause key={i} index={i + 1} clause={clause} />
          ))}
        </ol>

        {/* Notes. */}
        <div className="mt-3 border-t border-slate-200 pt-3 break-inside-avoid">
          <span className="font-sans text-2xs font-semibold uppercase tracking-[2pt] text-slate-400">
            Notes
          </span>
          <ol className="mt-2 flex flex-col gap-1">
            {data.footnotes.map((note, i) => (
              <li key={i} className="flex flex-row">
                <span className="mr-2 text-2xs text-slate-400">{i + 1}.</span>
                <p className="flex-1 text-2xs leading-snug text-slate-600">{note}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Execution clause. */}
        <p className="mt-6 text-justify text-sm leading-[1.55] text-slate-700">
          IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date, at{' '}
          {data.signedAt}, intending to be legally bound, under the laws of {data.governingLaw}.
        </p>

        {/* Signature section - always kept together on one page. */}
        <div className="mt-8 flex flex-row gap-12 break-inside-avoid">
          <SignatureColumn party={data.partyA} name="party_a_sig" />
          <SignatureColumn party={data.partyB} name="party_b_sig" />
        </div>
      </Page>
    </Document>
  );
}
