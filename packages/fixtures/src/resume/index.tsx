import { Document, Page } from '@imprint-pdf/react';
import type { ResumeData } from './sample.js';

export type {
  ResumeData,
  ResumeEducation,
  ResumeExperience,
  ResumeSkillGroup,
} from './sample.js';
export { resumeSample } from './sample.js';

export interface ResumeProps {
  data: ResumeData;
}

/** Accent eyebrow label used for sidebar section headers. */
function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col">
      <div className="mb-3 flex flex-row items-center gap-2">
        <div className="h-0.5 w-3 bg-teal-600" />
        <span className="font-sans text-[8px] font-bold uppercase tracking-[2pt] text-teal-300">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Initials monogram lockup for the sidebar header. */
function Monogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-[38px] w-[38px] flex-row items-center justify-center rounded-md bg-teal-600">
      <span className="font-serif text-[16px] font-bold tracking-[0.5pt] text-white">
        {initials}
      </span>
    </div>
  );
}

/** Main-column section header: serif heading + trailing rule + accent tick. */
function MainHeading({ label }: { label: string }) {
  return (
    <div className="mb-4 flex flex-row items-center gap-3">
      <span className="font-serif text-[14px] font-bold uppercase tracking-[2.5pt] text-slate-900">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
      <div className="h-0.5 w-5 bg-teal-600" />
    </div>
  );
}

export function Resume({ data }: ResumeProps) {
  return (
    <Document title={`${data.name} - Résumé`} author={data.name}>
      <Page size="A4" className="bg-white font-sans text-slate-900">
        <div className="flex flex-1 flex-row">
          {/* Sidebar */}
          <div className="flex w-[35%] flex-col bg-[#0f1729] px-8 py-11 text-slate-300">
            <div className="mb-9 flex flex-col">
              <Monogram name={data.name} />
              <h1 className="mt-5 font-serif text-[27px] font-bold leading-[1.02] tracking-[-0.4pt] text-slate-50">
                {data.name}
              </h1>
              <div className="mt-3 h-0.5 w-10 bg-teal-600" />
              <p className="mt-3 font-sans text-[9px] font-bold uppercase tracking-[2.2pt] text-teal-300">
                {data.title}
              </p>
            </div>

            <SidebarSection label="Contact">
              <p className="mb-1.5 text-[9.5px] leading-snug text-slate-300">
                {data.contact.email}
              </p>
              <p className="mb-1.5 text-[9.5px] leading-snug text-slate-300">
                {data.contact.phone}
              </p>
              <p className="mb-1.5 text-[9.5px] leading-snug text-slate-300">
                {data.contact.location}
              </p>
              <p className="text-[9.5px] leading-snug text-slate-300">{data.contact.website}</p>
            </SidebarSection>

            <SidebarSection label="Skills">
              {data.skills.map((group) => (
                <div key={group.label} className="mb-3.5 flex flex-col">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[1pt] text-teal-300">
                    {group.label}
                  </p>
                  <p className="text-[9.5px] leading-[1.5] text-slate-400">
                    {group.items.join('  ·  ')}
                  </p>
                </div>
              ))}
            </SidebarSection>

            <SidebarSection label="Education">
              {data.education.map((ed) => (
                <div key={ed.degree} className="flex flex-col">
                  <p className="font-serif text-[10.5px] font-bold leading-snug text-slate-50">
                    {ed.degree}
                  </p>
                  <p className="mt-1 text-[9.5px] text-slate-300">{ed.school}</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">{ed.year}</p>
                </div>
              ))}
            </SidebarSection>
          </div>

          {/* Main column */}
          <div className="flex flex-1 flex-col px-10 py-11">
            <div className="mb-9 flex flex-col">
              <MainHeading label="Profile" />
              <p className="font-serif text-[11px] leading-[1.62] text-pretty text-slate-700">
                {data.summary}
              </p>
            </div>

            <div className="flex flex-col">
              <MainHeading label="Experience" />
              {data.experience.map((job, idx) => (
                <div
                  key={`${job.company}-${job.start}`}
                  className={
                    idx === data.experience.length - 1 ? 'flex flex-col' : 'mb-6 flex flex-col'
                  }
                >
                  <div className="flex flex-row items-baseline justify-between">
                    <h3 className="font-serif text-[13px] font-bold leading-tight text-slate-900">
                      {job.role}
                    </h3>
                    <span className="font-sans text-[8.5px] font-bold uppercase tracking-[1pt] text-slate-400">
                      {job.start} - {job.end}
                    </span>
                  </div>
                  <div className="mb-2.5 mt-1 flex flex-row items-baseline justify-between">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.5pt] text-teal-600">
                      {job.company}
                    </p>
                    <span className="font-sans text-[9px] text-slate-500">{job.location}</span>
                  </div>
                  {job.bullets.map((b, i) => (
                    <div key={i} className="mb-1.5 flex flex-row">
                      <div className="mr-2.5 mt-[5px] h-1 w-1 rounded-[1px] bg-teal-600" />
                      <p className="flex-1 font-sans text-[10px] leading-[1.55] text-pretty text-slate-600">
                        {b}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Page>
    </Document>
  );
}
