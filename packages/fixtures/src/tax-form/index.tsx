import {
  Checkbox,
  Document,
  Dropdown,
  Form,
  Page,
  RadioGroup,
  TextField,
} from '@imprint-pdf/react';
import type { TaxFormData } from './sample.js';

export type { TaxFormData } from './sample.js';
export { taxFormSample } from './sample.js';

export interface TaxFormProps {
  data: TaxFormData;
}

export function TaxForm({ data }: TaxFormProps) {
  const d = data.defaults;
  return (
    <Document title={`${data.formCode} - ${data.formTitle}`} author={data.agency}>
      <Page size="A4" className="bg-white px-12 py-10 font-sans text-slate-900">
        <div className="flex flex-row items-start justify-between border-b-2 border-slate-900 pb-3">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-[1pt]">{data.formCode}</span>
            <span className="text-[9px] text-slate-500">{data.revision}</span>
          </div>
          <div className="flex flex-1 flex-col px-6">
            <h1 className="text-sm font-bold leading-tight text-slate-900">{data.formTitle}</h1>
            <span className="mt-1 text-[9px] text-slate-500">{data.agency}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500">Give Form to the</span>
            <span className="text-[9px] text-slate-500">requester. Do not</span>
            <span className="text-[9px] text-slate-500">send to the IRS.</span>
          </div>
        </div>

        <Form name="w9" className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
              1. Name (as shown on your income tax return)
            </span>
            <TextField
              name="legal_name"
              required
              defaultValue={d.name}
              className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
              2. Business name / disregarded entity name, if different from above
            </span>
            <TextField
              name="business_name"
              defaultValue={d.businessName}
              className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
              3. Federal tax classification
            </span>
            <RadioGroup
              name="tax_classification"
              options={data.classifications}
              defaultValue={d.classification}
              className="flex flex-col gap-1 text-xs text-slate-800"
            />
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
                4. Address (number, street, and apt. or suite no.)
              </span>
              <TextField
                name="street_address"
                defaultValue={d.address}
                className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
                5. City, state, and ZIP code
              </span>
              <TextField
                name="city_state_zip"
                defaultValue={d.cityStateZip}
                className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
              />
            </div>
            <div className="flex w-40 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
                State
              </span>
              <Dropdown
                name="state"
                options={data.states}
                defaultValue={d.state}
                className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
                6. Social security number
              </span>
              <TextField
                name="ssn"
                placeholder="___ - __ - ____"
                defaultValue={d.ssn}
                className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
                7. Employer identification number
              </span>
              <TextField
                name="ein"
                defaultValue={d.ein}
                className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 rounded border border-slate-300 bg-slate-50 p-3">
            <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
              Exemptions
            </span>
            <div className="flex flex-row items-center gap-2">
              <Checkbox name="exempt_payee" className="h-4 w-4 border border-slate-500" />
              <span className="text-xs text-slate-800">
                I am exempt from backup withholding (exempt payee).
              </span>
            </div>
            <div className="flex flex-row items-center gap-2">
              <Checkbox name="exempt_fatca" className="h-4 w-4 border border-slate-500" />
              <span className="text-xs text-slate-800">
                I am exempt from FATCA reporting requirements.
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 border-t-2 border-slate-900 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
              Part II - Certification
            </span>
            <p className="text-[10px] leading-relaxed text-slate-700">
              Under penalties of perjury, I certify that: (1) the number shown on this form is my
              correct taxpayer identification number; (2) I am not subject to backup withholding;
              and (3) I am a U.S. citizen or other U.S. person. The Internal Revenue Service does
              not require your consent to any provision of this document other than the
              certifications required to avoid backup withholding.
            </p>
            <div className="mt-1 flex flex-row items-center gap-2">
              <Checkbox
                name="certification"
                required
                defaultChecked
                className="h-4 w-4 border border-slate-500"
              />
              <span className="text-xs font-semibold text-slate-900">
                I have read and agree to the certification above.
              </span>
            </div>
            <div className="mt-3 flex flex-row gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
                  Signature of U.S. person
                </span>
                <TextField
                  name="signer_name"
                  className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
                />
              </div>
              <div className="flex w-40 flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[1pt] text-slate-600">
                  Date
                </span>
                <TextField
                  name="signed_date"
                  type="date"
                  className="h-8 w-full rounded border border-slate-400 px-2 text-sm"
                />
              </div>
            </div>
          </div>
        </Form>
      </Page>
    </Document>
  );
}
