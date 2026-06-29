export interface CertificateData {
  organization: string;
  title: string;
  preamble: string;
  recipient: string;
  description: string;
  date: string;
  certificateId: string;
  signatories: { name: string; role: string }[];
}

export const certificateSample: CertificateData = {
  organization: 'Northwind Institute of Design',
  title: 'Certificate of Achievement',
  preamble: 'This certificate is proudly presented to',
  recipient: 'Mara Okonkwo',
  description:
    'in recognition of outstanding completion of the Advanced Design Systems Program, demonstrating exceptional skill, dedication, and mastery of the craft.',
  date: 'June 29, 2026',
  certificateId: 'NID-2026-04817',
  signatories: [
    { name: 'Daniel Reyes', role: 'Program Director' },
    { name: 'Priya Anand', role: 'Dean of Studies' },
  ],
};
