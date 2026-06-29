export interface TaxFormData {
  formTitle: string;
  formCode: string;
  revision: string;
  agency: string;
  classifications: { value: string; label: string }[];
  states: { value: string; label: string }[];
  defaults: {
    name: string;
    businessName: string;
    address: string;
    cityStateZip: string;
    ssn: string;
    ein: string;
    classification: string;
    state: string;
  };
}

export const taxFormSample: TaxFormData = {
  formTitle: 'Request for Taxpayer Identification Number and Certification',
  formCode: 'Form W-9',
  revision: 'Rev. March 2026',
  agency: 'Department of the Treasury - Internal Revenue Service',
  classifications: [
    { value: 'individual', label: 'Individual / sole proprietor' },
    { value: 'c-corp', label: 'C Corporation' },
    { value: 's-corp', label: 'S Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'trust', label: 'Trust / estate' },
    { value: 'llc', label: 'Limited liability company' },
  ],
  states: [
    { value: 'CA', label: 'California' },
    { value: 'NY', label: 'New York' },
    { value: 'TX', label: 'Texas' },
    { value: 'WA', label: 'Washington' },
    { value: 'IL', label: 'Illinois' },
  ],
  defaults: {
    name: 'Helena Vasquez',
    businessName: 'Northwind Studio LLC',
    address: '500 Market Street, Suite 1200',
    cityStateZip: 'San Francisco, CA 94105',
    ssn: '',
    ein: '47-1234567',
    classification: 'llc',
    state: 'CA',
  },
};
