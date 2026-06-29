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

const fieldClass =
  'h-7 w-full rounded-sm border border-slate-300 bg-white px-2 text-sm text-slate-900';

/** Uppercase tracked eyebrow label sitting above a bordered input. */
function FieldLabel({ index, children }: { index?: string; children: string }) {
  return (
    <span className="text-2xs font-semibold uppercase tracking-[1.2pt] text-slate-600">
      {index ? <span className="text-blue-700">{index} </span> : null}
      {children}
    </span>
  );
}

/** Numbered section heading with an accent eyebrow and trailing rule. */
function PartHeading({ part, children }: { part: string; children: string }) {
  return (
    <div className="flex flex-row items-center gap-2.5">
      <span className="rounded-sm bg-blue-700 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-[1.5pt] text-white">
        {part}
      </span>
      <span className="text-base font-bold tracking-[-0.2pt] text-slate-900">{children}</span>
      <div className="h-px flex-1 bg-slate-300" />
    </div>
  );
}

export function TaxForm({ data }: TaxFormProps) {
  const d = data.defaults;
  return (
    <Document title={`${data.formCode} - ${data.formTitle}`} author={data.agency}>
      <Page size="A4" className="bg-white px-12 pb-10 pt-0 font-sans text-slate-900">
        {/* Bold colored masthead band, bleeding to the page edges */}
        <div className="-mx-12 flex flex-row items-stretch justify-between gap-6 bg-blue-900 px-12 pb-6 pt-9">
          <div className="flex flex-col justify-center">
            {/* Brand mark: two offset coloured squares + wordmark */}
            <div className="flex flex-row items-center gap-2">
              <div className="relative h-[18px] w-[18px]">
                <div className="absolute left-0 top-0 h-[13px] w-[13px] rounded-sm bg-white" />
                <div className="absolute bottom-0 right-0 h-[13px] w-[13px] rounded-sm bg-blue-300" />
              </div>
              <span className="text-base font-bold tracking-[-0.2pt] text-white">
                {data.agency}
              </span>
            </div>
            <div className="mt-3 flex flex-row items-baseline gap-3">
              <h1 className="text-4xl font-bold leading-none tracking-[-1pt] text-white">
                {data.formCode}
              </h1>
              <span className="rounded-full bg-blue-200 px-2 py-0.5 text-2xs font-bold uppercase tracking-[1pt] text-blue-900">
                {data.revision}
              </span>
            </div>
            <p className="mt-2.5 max-w-[340px] text-sm font-medium leading-snug text-blue-100">
              {data.formTitle}
            </p>
          </div>
          <div className="flex w-[160px] flex-col justify-center rounded-sm border border-white/30 bg-white/10 px-3 py-2.5">
            <span className="text-2xs font-bold uppercase tracking-[1.5pt] text-blue-200">
              Instructions
            </span>
            <p className="mt-1.5 text-2xs leading-snug text-blue-50">
              Give this form to the requester. Do not send it to the IRS.
            </p>
          </div>
        </div>

        <Form name="w9" className="mt-6 flex flex-col gap-4">
          {/* Part I - Identification */}
          <PartHeading part="Part I">Taxpayer identification</PartHeading>

          <div className="flex flex-col gap-1">
            <FieldLabel index="1.">Name (as shown on your income tax return)</FieldLabel>
            <TextField name="legal_name" required defaultValue={d.name} className={fieldClass} />
          </div>

          <div className="flex flex-col gap-1">
            <FieldLabel index="2.">
              Business name / disregarded entity, if different from above
            </FieldLabel>
            <TextField name="business_name" defaultValue={d.businessName} className={fieldClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel index="3.">Federal tax classification</FieldLabel>
            <div className="rounded-sm border border-slate-300 bg-slate-50 p-2.5">
              <RadioGroup
                name="tax_classification"
                options={data.classifications}
                defaultValue={d.classification}
                className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel index="4.">Address (number, street, and apt. or suite no.)</FieldLabel>
              <TextField name="street_address" defaultValue={d.address} className={fieldClass} />
            </div>
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel index="5.">City, state, and ZIP code</FieldLabel>
              <TextField
                name="city_state_zip"
                defaultValue={d.cityStateZip}
                className={fieldClass}
              />
            </div>
            <div className="flex w-44 flex-col gap-1">
              <FieldLabel>State</FieldLabel>
              <Dropdown
                name="state"
                options={data.states}
                defaultValue={d.state}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel index="6.">Social security number</FieldLabel>
              <TextField
                name="ssn"
                placeholder="___ - __ - ____"
                defaultValue={d.ssn}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel index="7.">Employer identification number</FieldLabel>
              <TextField name="ein" defaultValue={d.ein} className={fieldClass} />
            </div>
          </div>

          {/* Panelled exemptions box */}
          <div className="mt-1 flex flex-col rounded-sm border border-slate-300">
            <div className="rounded-t-sm border-b border-slate-300 bg-slate-50 px-3 py-1.5">
              <FieldLabel>Exemptions (codes apply only to certain entities)</FieldLabel>
            </div>
            <div className="flex flex-col gap-2 px-3 py-2.5">
              <div className="flex flex-row items-center gap-2">
                <Checkbox
                  name="exempt_payee"
                  className="h-3.5 w-3.5 rounded-sm border border-slate-600"
                />
                <span className="text-sm text-slate-900">
                  I am exempt from backup withholding (exempt payee).
                </span>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Checkbox
                  name="exempt_fatca"
                  className="h-3.5 w-3.5 rounded-sm border border-slate-600"
                />
                <span className="text-sm text-slate-900">
                  I am exempt from FATCA reporting requirements.
                </span>
              </div>
            </div>
          </div>

          {/* Part II - Certification */}
          <div className="mt-2 flex flex-col gap-2.5">
            <PartHeading part="Part II">Certification</PartHeading>
            <p className="text-xs leading-relaxed text-slate-600">
              Under penalties of perjury, I certify that: (1) the number shown on this form is my
              correct taxpayer identification number; (2) I am not subject to backup withholding;
              and (3) I am a U.S. citizen or other U.S. person. The Internal Revenue Service does
              not require your consent to any provision of this document other than the
              certifications required to avoid backup withholding.
            </p>
            <div className="mt-1 flex flex-row items-center gap-2.5 rounded-sm border-l-[3px] border-blue-700 bg-blue-50 px-3 py-2.5">
              <Checkbox
                name="certification"
                required
                defaultChecked
                className="h-3.5 w-3.5 rounded-sm border border-blue-700"
              />
              <span className="text-sm font-semibold text-slate-900">
                I have read and agree to the certification above.
              </span>
            </div>
            <div className="mt-3 flex flex-row items-end gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <FieldLabel>Signature of U.S. person</FieldLabel>
                <TextField name="signer_name" className={fieldClass} />
              </div>
              <div className="flex w-44 flex-col gap-1">
                <FieldLabel>Date</FieldLabel>
                <TextField name="signed_date" type="date" className={fieldClass} />
              </div>
            </div>
          </div>
        </Form>

        <div className="flex-1" />
        <div className="mt-8 flex flex-row items-center justify-between border-t border-slate-300 pt-3">
          <span className="text-2xs uppercase tracking-[1.5pt] text-slate-400">
            {data.formCode} &middot; {data.revision}
          </span>
          <span className="text-2xs uppercase tracking-[1.5pt] text-slate-400">{data.agency}</span>
        </div>
      </Page>
    </Document>
  );
}
