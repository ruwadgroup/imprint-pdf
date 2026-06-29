import { Document, Page } from '@imprint-pdf/react/standalone';
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

export function Resume({ data }: ResumeProps) {
  return (
    <Document title={`${data.name} - Résumé`} author={data.name}>
      <Page size="A4" className="bg-white font-sans text-slate-900">
        <div className="flex flex-row flex-1">
          <div
            className="flex flex-col bg-slate-800 text-slate-100 px-7 py-10"
            style={{ width: '34%' }}
          >
            <div className="flex flex-col mb-8">
              <h1 className="text-2xl font-bold leading-tight text-white">{data.name}</h1>
              <p className="text-xs font-semibold tracking-[1.5pt] text-indigo-300 mt-2 uppercase">
                {data.title}
              </p>
            </div>

            <div className="flex flex-col mb-8">
              <span className="text-xs font-bold tracking-[1.5pt] text-slate-400 uppercase mb-3">
                Contact
              </span>
              <p className="text-xs text-slate-200 mb-1.5">{data.contact.email}</p>
              <p className="text-xs text-slate-200 mb-1.5">{data.contact.phone}</p>
              <p className="text-xs text-slate-200 mb-1.5">{data.contact.location}</p>
              <p className="text-xs text-slate-200">{data.contact.website}</p>
            </div>

            <div className="flex flex-col mb-8">
              <span className="text-xs font-bold tracking-[1.5pt] text-slate-400 uppercase mb-3">
                Skills
              </span>
              {data.skills.map((group) => (
                <div key={group.label} className="flex flex-col mb-4">
                  <p className="text-xs font-semibold text-indigo-300 mb-1.5">{group.label}</p>
                  {group.items.map((item) => (
                    <p key={item} className="text-xs text-slate-200 mb-1">
                      {item}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-[1.5pt] text-slate-400 uppercase mb-3">
                Education
              </span>
              {data.education.map((ed) => (
                <div key={ed.degree} className="flex flex-col mb-3">
                  <p className="text-xs font-semibold text-white">{ed.degree}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{ed.school}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ed.year}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col flex-1 px-9 py-10">
            <div className="flex flex-col mb-8">
              <span className="text-sm font-bold tracking-[1.5pt] text-indigo-600 uppercase mb-2">
                Summary
              </span>
              <p className="text-xs leading-relaxed text-slate-600 text-pretty">{data.summary}</p>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-[1.5pt] text-indigo-600 uppercase mb-4">
                Experience
              </span>
              {data.experience.map((job) => (
                <div key={`${job.company}-${job.start}`} className="flex flex-col mb-6">
                  <div className="flex flex-row justify-between items-baseline">
                    <h3 className="text-sm font-bold text-slate-900">{job.role}</h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {job.start} - {job.end}
                    </span>
                  </div>
                  <div className="flex flex-row justify-between items-baseline mt-0.5 mb-2">
                    <p className="text-xs font-semibold text-indigo-600">{job.company}</p>
                    <span className="text-xs text-slate-400">{job.location}</span>
                  </div>
                  {job.bullets.map((b, i) => (
                    <div key={i} className="flex flex-row mb-1.5">
                      <span className="text-xs text-indigo-400 mr-2">•</span>
                      <p className="text-xs leading-relaxed text-slate-600 flex-1 text-pretty">
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
