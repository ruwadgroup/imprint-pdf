export interface CoverLetterData {
  sender: { name: string; title: string; email: string; phone: string; location: string };
  date: string;
  recipient: { name: string; title: string; company: string; address: string };
  salutation: string;
  paragraphs: string[];
  closing: string;
}

export const coverLetterSample: CoverLetterData = {
  sender: {
    name: 'Mara Okonkwo',
    title: 'Senior Product Designer',
    email: 'mara.okonkwo@mail.com',
    phone: '+1 (415) 555-0182',
    location: 'San Francisco, CA',
  },
  date: 'June 29, 2026',
  recipient: {
    name: 'Daniel Reyes',
    title: 'Head of Design',
    company: 'Meridian Systems',
    address: '120 Spear Street, Suite 900, San Francisco, CA 94105',
  },
  salutation: 'Dear Mr. Reyes,',
  paragraphs: [
    'I am writing to express my interest in the Principal Product Designer role at Meridian Systems. Over the past nine years I have specialized in the kind of data-dense, high-stakes interfaces your platform is known for, and the prospect of bringing that craft to your reconciliation tooling is genuinely exciting to me.',
    'At Ledgerline I led the redesign of our reconciliation workspace, a project that touched four thousand finance teams and reduced their average close time by nearly a third. The work demanded equal parts systems thinking and restraint: every control we added had to earn its place against the cognitive load it introduced. I learned to treat clarity as a feature, not a finish.',
    'What draws me to Meridian specifically is your stated commitment to designing for practitioners rather than dashboards. I have spent years arguing that the most valuable interfaces disappear into the workflow, and I would welcome the chance to push that philosophy further alongside a team that already shares it.',
    'I would be glad to walk you through my portfolio and discuss how my experience maps to your roadmap. Thank you for your time and consideration; I look forward to the possibility of speaking with you.',
  ],
  closing: 'Sincerely,',
};
