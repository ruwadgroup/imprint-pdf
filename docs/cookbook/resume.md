# Cookbook — Resume

A clean, single-page resume with a sidebar layout using CSS Grid.

## What you'll build

- 2-column CSS Grid layout (sidebar + main)
- Custom fonts (Inter for body, JetBrains Mono for code)
- Section headings with a border-bottom rule
- Icon-labelled contact info using inline SVG

## Template sketch

```tsx
// src/templates/Resume.tsx
import { Document, Page } from '@imprint/react';

interface ResumeProps {
  data: {
    name: string;
    title: string;
    contact: { email: string; github: string; location: string };
    summary: string;
    experience: Array<{
      company: string;
      role: string;
      period: string;
      bullets: string[];
    }>;
    skills: string[];
    education: Array<{ institution: string; degree: string; year: string }>;
  };
}

export function Resume({ data }: ResumeProps) {
  return (
    <Document title={`${data.name} — Resume`} lang="en">
      <Page
        size="Letter"
        className="font-sans text-[10pt] text-gray-900 bg-white"
      >
        <div className="grid grid-cols-[200px_1fr] min-h-full">
          {/* Sidebar */}
          <div className="bg-gray-50 p-6 border-r border-gray-200">
            <p className="text-lg font-bold leading-tight">{data.name}</p>
            <p className="mt-1 text-xs text-gray-500 font-medium uppercase tracking-wide">
              {data.title}
            </p>

            <div className="mt-6 space-y-1 text-xs text-gray-600">
              <p>{data.contact.email}</p>
              <p>{data.contact.github}</p>
              <p>{data.contact.location}</p>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[9pt]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Education
              </p>
              {data.education.map((edu, i) => (
                <div key={i} className="mt-2">
                  <p className="font-medium text-[9pt]">{edu.degree}</p>
                  <p className="text-[9pt] text-gray-500">{edu.institution}</p>
                  <p className="text-[9pt] text-gray-400">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="p-8">
            <p className="text-sm leading-relaxed text-gray-600 border-b border-gray-200 pb-4">
              {data.summary}
            </p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Experience
              </p>
              {data.experience.map((exp, i) => (
                <div key={i} className="mt-4 first:mt-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold">{exp.role}</p>
                    <p className="text-[9pt] text-gray-500">{exp.period}</p>
                  </div>
                  <p className="text-[9pt] text-gray-500 font-medium">
                    {exp.company}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {exp.bullets.map((b, j) => (
                      <li
                        key={j}
                        className="flex gap-2 text-[9pt] text-gray-700"
                      >
                        <span>•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Page>
    </Document>
  );
}
```

## Key patterns

- `grid-cols-[200px_1fr]` — arbitrary CSS Grid column template.
- `first:mt-0` — removes top margin on the first experience entry.
- `text-[9pt]` — arbitrary point size for tight typesetting on a resume.
- `min-h-full` on the grid container ensures both columns reach the bottom of
  the page.
