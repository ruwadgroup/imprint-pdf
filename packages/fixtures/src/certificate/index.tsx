import { Document, Page } from '@imprint-pdf/react';
import type { CertificateData } from './sample.js';

export type { CertificateData } from './sample.js';
export { certificateSample } from './sample.js';

export interface CertificateProps {
  data: CertificateData;
}

function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return <>{letters}</>;
}

function CornerFlourish({ className }: { className?: string }) {
  return (
    <div className={`flex flex-row items-center gap-1 ${className ?? ''}`}>
      <div className="h-2 w-2 rotate-45 bg-[#b08d57]" />
      <div className="h-[5px] w-[5px] rotate-45 border border-[#b08d57]" />
    </div>
  );
}

function Seal({ name }: { name: string }) {
  return (
    <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full border-2 border-[#b08d57]">
      <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full border border-[#b08d57] bg-[#16233f]">
        <span className="text-[7px] font-semibold uppercase tracking-[2pt] text-[#b08d57]">
          Seal
        </span>
        <span className="font-display text-[20px] font-bold leading-none text-white">
          <Initials name={name} />
        </span>
        <span className="text-[7px] font-semibold uppercase tracking-[2pt] text-[#b08d57]">
          Honoris
        </span>
      </div>
    </div>
  );
}

function SignatureBlock({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex w-[200px] flex-col items-center">
      <p className="font-script text-[24px] leading-none text-[#1e2a44]">{name}</p>
      <div className="mt-1 w-full border-t border-[#b08d57]" />
      <p className="mt-2 font-sans text-[8px] font-semibold uppercase tracking-[2pt] text-[#5b6678]">
        {role}
      </p>
    </div>
  );
}

export function Certificate({ data }: CertificateProps) {
  const [left, right] = data.signatories;
  return (
    <Document title={data.title} author={data.organization}>
      <Page size="A4" orientation="landscape" className="bg-[#faf7f1] p-4 font-sans">
        {/* Outer accent frame: thick gold border */}
        <div className="relative flex flex-1 flex-col border-[2.5px] border-[#b08d57] bg-white p-1">
          {/* Inner thin rule, a few px inside the thick border */}
          <div className="relative flex flex-1 flex-col items-center justify-between border border-[#b08d57] px-16 py-8">
            {/* Corner flourishes anchored to the inner panel */}
            <div className="absolute left-2 top-2">
              <CornerFlourish />
            </div>
            <div className="absolute right-2 top-2">
              <CornerFlourish />
            </div>
            <div className="absolute bottom-2 left-2">
              <CornerFlourish />
            </div>
            <div className="absolute bottom-2 right-2">
              <CornerFlourish />
            </div>

            {/* Header: issuer eyebrow + title */}
            <div className="relative flex flex-col items-center">
              <p className="text-[9px] font-semibold uppercase tracking-[4pt] text-[#b08d57]">
                {data.organization}
              </p>
              <h1 className="mt-3 text-center font-display text-[40px] font-bold leading-none tracking-[1pt] text-[#16233f]">
                {data.title}
              </h1>
              <div className="mt-3 flex flex-row items-center gap-2.5">
                <div className="h-px w-[54px] bg-[#b08d57]" />
                <div className="h-1.5 w-1.5 rotate-45 bg-[#b08d57]" />
                <div className="h-px w-[54px] bg-[#b08d57]" />
              </div>
            </div>

            {/* Recipient block */}
            <div className="relative flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-[3pt] text-[#5b6678]">{data.preamble}</p>
              <p className="mt-2 text-center font-script text-[64px] leading-none text-[#b08d57]">
                {data.recipient}
              </p>
              <div className="mt-3 h-px w-[320px] bg-[#e3dccd]" />
              <p className="mt-4 max-w-[520px] text-center font-display text-[12px] font-medium leading-relaxed text-[#1e2a44]">
                {data.description}
              </p>
            </div>

            {/* Footer: signatures flanking seal */}
            <div className="relative flex w-full flex-row items-end justify-between">
              {left ? (
                <SignatureBlock name={left.name} role={left.role} />
              ) : (
                <div className="w-[200px]" />
              )}

              <div className="flex flex-col items-center">
                <Seal name={data.recipient} />
                <p className="mt-3 text-[9px] font-semibold uppercase tracking-[2pt] text-[#1e2a44]">
                  {data.date}
                </p>
                <p className="mt-1 text-[8px] uppercase tracking-[1.5pt] text-[#8a93a5]">
                  No. {data.certificateId}
                </p>
              </div>

              {right ? (
                <SignatureBlock name={right.name} role={right.role} />
              ) : (
                <div className="w-[200px]" />
              )}
            </div>
          </div>
        </div>
      </Page>
    </Document>
  );
}
