export interface ContractParty {
  role: string;
  name: string;
  entity: string;
  address: string;
}

export interface ContractClause {
  heading: string;
  body: string;
}

export interface ContractData {
  title: string;
  effectiveDate: string;
  governingLaw: string;
  partyA: ContractParty;
  partyB: ContractParty;
  recitals: string[];
  clauses: ContractClause[];
  footnotes: string[];
  signedAt: string;
}

export const contractSample: ContractData = {
  title: 'Mutual Non-Disclosure Agreement',
  effectiveDate: 'June 1, 2026',
  governingLaw: 'the State of Delaware',
  partyA: {
    role: 'Disclosing Party',
    name: 'Helena Vasquez',
    entity: 'Northwind Studio LLC',
    address: '500 Market Street, Suite 1200, San Francisco, CA 94105',
  },
  partyB: {
    role: 'Receiving Party',
    name: 'Marcus Bell',
    entity: 'Acme Corporation, Inc.',
    address: '1 Innovation Way, Austin, TX 78701',
  },
  recitals: [
    'WHEREAS, the parties wish to explore a potential business relationship of mutual benefit (the "Purpose");',
    'WHEREAS, in connection with the Purpose each party may disclose to the other certain confidential and proprietary information;',
    'NOW, THEREFORE, in consideration of the mutual covenants and promises set forth herein, the parties agree as follows:',
  ],
  clauses: [
    {
      heading: 'Definition of Confidential Information',
      body: '"Confidential Information" means any and all non-public information, in whatever form or medium, disclosed by one party (the "Disclosing Party") to the other (the "Receiving Party"), whether before or after the Effective Date, including without limitation technical data, trade secrets, know-how, research, product plans, products, services, customer lists, markets, software, developments, inventions, processes, formulas, designs, drawings, engineering, marketing, finances, or other business information, whether or not marked or otherwise designated as confidential at the time of disclosure.',
    },
    {
      heading: 'Exclusions from Confidential Information',
      body: 'Confidential Information shall not include information that: (a) is or becomes generally available to the public other than as a result of a breach of this Agreement by the Receiving Party; (b) was rightfully in the Receiving Party’s possession prior to disclosure, free of any obligation of confidence; (c) is independently developed by the Receiving Party without use of or reference to the Confidential Information; or (d) is rightfully obtained by the Receiving Party from a third party not under an obligation of confidentiality.',
    },
    {
      heading: 'Obligations of the Receiving Party',
      body: 'The Receiving Party shall hold the Confidential Information in strict confidence and shall use the same degree of care to protect it that it uses to protect its own confidential information of a similar nature, but in no event less than a reasonable degree of care. The Receiving Party shall not disclose any Confidential Information to any third party without the prior written consent of the Disclosing Party, and shall limit access to those of its employees, agents, and advisors who have a legitimate need to know for the Purpose and who are bound by obligations of confidentiality no less protective than those set forth herein.',
    },
    {
      heading: 'Permitted Use',
      body: 'The Receiving Party shall use the Confidential Information solely for the Purpose and for no other purpose whatsoever. Nothing in this Agreement shall be construed as granting any rights, by license or otherwise, to any Confidential Information except the limited right to use such information for the Purpose during the term of this Agreement.',
    },
    {
      heading: 'Compelled Disclosure',
      body: 'In the event the Receiving Party is required by law, regulation, or valid order of a court or other governmental body to disclose any Confidential Information, the Receiving Party shall, to the extent legally permitted, provide the Disclosing Party with prompt prior written notice of such requirement so that the Disclosing Party may seek a protective order or other appropriate remedy, and shall disclose only that portion of the Confidential Information that it is legally compelled to disclose.',
    },
    {
      heading: 'Return or Destruction of Materials',
      body: 'Upon the written request of the Disclosing Party, or upon termination of this Agreement, the Receiving Party shall promptly return or, at the Disclosing Party’s election, destroy all materials embodying Confidential Information in its possession or control, together with all copies thereof, and shall certify in writing to such return or destruction; provided, however, that the Receiving Party may retain one archival copy solely for the purpose of monitoring its obligations hereunder.',
    },
    {
      heading: 'No Warranty',
      body: 'All Confidential Information is provided "AS IS." The Disclosing Party makes no warranties, express or implied, with respect to the accuracy, completeness, or fitness for a particular purpose of any Confidential Information, and shall have no liability arising out of the Receiving Party’s use of or reliance upon any Confidential Information.',
    },
    {
      heading: 'Term and Survival',
      body: 'This Agreement shall remain in effect for a period of three (3) years from the Effective Date, unless earlier terminated by either party upon thirty (30) days’ written notice. The obligations of confidentiality set forth herein shall survive any termination of this Agreement and shall continue for a period of five (5) years following the date of disclosure of the applicable Confidential Information.',
    },
    {
      heading: 'No Obligation to Proceed',
      body: 'Nothing in this Agreement shall obligate either party to proceed with any transaction or business relationship between them, and each party reserves the right, in its sole discretion, to terminate the discussions contemplated by this Agreement at any time and for any reason.',
    },
    {
      heading: 'Remedies',
      body: 'The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages would be an inadequate remedy. Accordingly, the Disclosing Party shall be entitled to seek injunctive relief and specific performance, in addition to any other remedies available at law or in equity, without the necessity of posting a bond or other security.',
    },
    {
      heading: 'Assignment',
      body: 'Neither party may assign or transfer this Agreement, in whole or in part, without the prior written consent of the other party, except that either party may assign this Agreement to a successor in connection with a merger, acquisition, or sale of all or substantially all of its assets. Any attempted assignment in violation of this Section shall be null and void.',
    },
    {
      heading: 'Governing Law and Entire Agreement',
      body: 'This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction set forth above, without regard to its conflict of laws principles. This Agreement constitutes the entire understanding between the parties with respect to its subject matter and supersedes all prior or contemporaneous agreements, whether written or oral. Any amendment must be in writing and signed by both parties.',
    },
  ],
  footnotes: [
    'This document is a sample fixture and does not constitute legal advice. Consult qualified counsel before execution.',
    'Capitalized terms not otherwise defined herein shall have the meanings ascribed to them in the recitals above.',
    'If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
  ],
  signedAt: 'San Francisco, California',
};
