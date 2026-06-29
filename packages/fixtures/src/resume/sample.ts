export interface ResumeExperience {
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  year: string;
}

export interface ResumeSkillGroup {
  label: string;
  items: string[];
}

export interface ResumeData {
  name: string;
  title: string;
  contact: { email: string; phone: string; location: string; website: string };
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkillGroup[];
}

export const resumeSample: ResumeData = {
  name: 'Mara Okonkwo',
  title: 'Senior Product Designer',
  contact: {
    email: 'mara.okonkwo@mail.com',
    phone: '+1 (415) 555-0182',
    location: 'San Francisco, CA',
    website: 'maraokonkwo.design',
  },
  summary:
    'Product designer with nine years shaping data-dense tools for fintech and developer platforms. I pair systems thinking with hands-on prototyping to ship interfaces that stay legible under real-world complexity.',
  experience: [
    {
      role: 'Senior Product Designer',
      company: 'Ledgerline',
      location: 'San Francisco, CA',
      start: '2021',
      end: 'Present',
      bullets: [
        'Led the redesign of the reconciliation workspace, cutting average close time by 31% across 4,000 finance teams.',
        'Built and maintained the design-token pipeline adopted by twelve product squads.',
        'Mentored four designers and ran the weekly critique that doubled in attendance.',
      ],
    },
    {
      role: 'Product Designer',
      company: 'Northwind Studio',
      location: 'Remote',
      start: '2017',
      end: '2021',
      bullets: [
        'Owned end-to-end design for a developer dashboard from concept to GA launch.',
        'Established the first accessibility audit cycle, lifting WCAG conformance to AA.',
      ],
    },
    {
      role: 'UX Designer',
      company: 'Cobalt Labs',
      location: 'Austin, TX',
      start: '2015',
      end: '2017',
      bullets: [
        'Designed onboarding flows that raised activation by 18% in two quarters.',
        'Partnered with research to run twenty moderated usability sessions.',
      ],
    },
  ],
  education: [
    { degree: 'B.F.A. Interaction Design', school: 'Rhode Island School of Design', year: '2015' },
  ],
  skills: [
    { label: 'Design', items: ['Design systems', 'Prototyping', 'Interaction', 'Accessibility'] },
    { label: 'Tools', items: ['Figma', 'Framer', 'Storybook', 'Linear'] },
    { label: 'Research', items: ['Usability testing', 'Journey mapping', 'A/B analysis'] },
  ],
};
