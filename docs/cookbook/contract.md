# Cookbook — Contract with AcroForm

A multi-page contract PDF with a fillable AcroForm signature section.

## What you'll build

- Cover page with parties and effective date
- Terms and conditions body (multi-page, auto-broken)
- Signature page with `<Signature>` and `<Checkbox>` fields
- Digital PKCS#7 signing via `@imprint/sign` (optional, Enterprise)

## Template sketch

```tsx
// src/templates/Contract.tsx
import { Document, Page, View, Form, TextField, Checkbox, Signature, Button } from '@imprint/react';

interface ContractProps {
  contract: {
    title: string;
    parties: { party: string; name: string; address: string }[];
    effectiveDate: string;
    clauses: { heading: string; body: string }[];
    requiresSignature: boolean;
  };
}

export function Contract({ contract }: ContractProps) {
  return (
    <Document title={contract.title} lang="en">

      {/* Cover page */}
      <Page size="Letter" className="p-[72pt] font-serif">
        <View className="flex flex-col items-center text-center h-full justify-center">
          <p className="text-2xl font-bold tracking-tight">{contract.title}</p>
          <p className="mt-4 text-base text-gray-600">
            Effective {contract.effectiveDate}
          </p>
          <View className="mt-12 grid grid-cols-2 gap-16 w-full max-w-md">
            {contract.parties.map(p => (
              <View key={p.party}>
                <p className="text-xs uppercase tracking-wider text-gray-400">{p.party}</p>
                <p className="mt-1 font-semibold">{p.name}</p>
                <p className="text-sm text-gray-500">{p.address}</p>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Terms */}
      <Page size="Letter" className="p-[72pt] font-serif text-[11pt]">
        {contract.clauses.map((clause, i) => (
          <View key={i} className="mt-6 first:mt-0 break-inside-avoid">
            <h3 className="font-bold text-[11pt] break-after-avoid">
              {i + 1}. {clause.heading}
            </h3>
            <p className="mt-1 text-justify leading-[1.6] [widows:3] [orphans:3]">
              {clause.body}
            </p>
          </View>
        ))}
      </Page>

      {/* Signature page */}
      {contract.requiresSignature && (
        <Page size="Letter" className="p-[72pt] font-serif">
          <h2 className="text-lg font-bold break-before-page">Signatures</h2>

          <Form name="signatures">
            <View className="mt-8 grid grid-cols-2 gap-12">
              {contract.parties.map(p => (
                <View key={p.party}>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    {p.party}
                  </p>
                  <Signature
                    name={`sig_${p.party.toLowerCase()}`}
                    className="h-20 w-full border-b border-gray-400"
                  />
                  <TextField
                    name={`name_${p.party.toLowerCase()}`}
                    placeholder="Printed name"
                    className="mt-2 w-full border-b border-gray-300 text-sm py-1"
                  />
                  <TextField
                    name={`date_${p.party.toLowerCase()}`}
                    placeholder="Date"
                    className="mt-2 w-32 border-b border-gray-300 text-sm py-1"
                  />
                </View>
              ))}
            </View>

            <View className="mt-8 flex items-start gap-2">
              <Checkbox name="agree" required className="mt-0.5 h-4 w-4" />
              <p className="text-xs text-gray-600 leading-relaxed">
                By signing, both parties acknowledge they have read and agree to
                the terms set forth in this agreement.
              </p>
            </View>
          </Form>
        </Page>
      )}

    </Document>
  );
}
```

## Applying a digital signature (Enterprise)

```ts
import { renderToBuffer } from '@imprint/react';
import { signBuffer } from '@imprint/sign';
import { Contract } from './templates/Contract';

const unsigned = await renderToBuffer(<Contract contract={data} />);

const signed = await signBuffer(unsigned, {
  certificate: fs.readFileSync('./certs/company.pem', 'utf8'),
  privateKey: fs.readFileSync('./certs/company.key', 'utf8'),
  reason: 'Agreement executed',
  location: 'San Francisco, CA',
});
```
