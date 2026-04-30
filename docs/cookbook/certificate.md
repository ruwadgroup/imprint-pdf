# Cookbook — Certificate

A one-page certificate of completion with decorative borders and custom fonts.

## Template sketch

```tsx
// src/templates/Certificate.tsx
import { Document, Page, View, Image } from '@imprint/react';

interface CertificateProps {
  cert: {
    recipientName: string;
    courseName: string;
    completionDate: string;
    issuedBy: string;
    instructorName: string;
    credentialId: string;
  };
}

export function Certificate({ cert }: CertificateProps) {
  return (
    <Document title={`Certificate — ${cert.recipientName}`} lang="en">
      <Page
        size="A4"
        orientation="landscape"
        className="relative font-serif bg-white"
      >
        {/* Decorative border */}
        <View className="absolute inset-4 border-[3px] border-[#C9A84C] pointer-events-none" />
        <View className="absolute inset-[18px] border border-[#C9A84C] pointer-events-none" />

        {/* Content */}
        <View className="flex flex-col items-center justify-center h-full px-20 text-center">
          <Image
            src="./public/seal.png"
            alt="Official seal"
            className="h-20 w-20"
          />

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[#C9A84C]">
            Certificate of Completion
          </p>

          <p className="mt-4 text-sm text-gray-500">This is to certify that</p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
            {cert.recipientName}
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            has successfully completed the course
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-gray-800">
            {cert.courseName}
          </h2>

          <p className="mt-6 text-xs text-gray-400">
            Completed on {cert.completionDate}
          </p>

          {/* Footer */}
          <View className="mt-12 grid grid-cols-3 gap-16 w-full max-w-xl">
            <View className="flex flex-col items-center">
              <View className="w-32 border-b border-gray-300" />
              <p className="mt-1 text-xs text-gray-500">
                {cert.instructorName}
              </p>
              <p className="text-[9pt] text-gray-400">Instructor</p>
            </View>
            <View className="flex flex-col items-center">
              <Image
                src="./public/signature.png"
                alt="Signature"
                className="h-8 w-auto"
              />
              <View className="w-32 border-b border-gray-300 mt-1" />
              <p className="mt-1 text-xs text-gray-500">{cert.issuedBy}</p>
              <p className="text-[9pt] text-gray-400">Issuing Organization</p>
            </View>
            <View className="flex flex-col items-center">
              <View className="w-32 border-b border-gray-300" />
              <p className="mt-1 text-[9pt] text-gray-400">Credential ID</p>
              <p className="text-[9pt] font-mono text-gray-500">
                {cert.credentialId}
              </p>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

## Usage

```ts
const pdf = await renderToBuffer(
  <Certificate cert={{
    recipientName: 'Ada Lovelace',
    courseName: 'Advanced TypeScript Engineering',
    completionDate: 'January 15, 2026',
    issuedBy: 'Acme Academy',
    instructorName: 'Dr. Alan Turing',
    credentialId: 'CERT-2026-AAT-00142',
  }} />
);
```

## Key patterns

- Landscape orientation via `<Page size="A4" orientation="landscape">`.
- `absolute inset-*` for the decorative border — rendered over the content
  layer, does not affect layout flow.
- Arbitrary colour values: `border-[#C9A84C]`, `text-[#C9A84C]`.
- `tracking-[0.3em]` — wide letter-spacing for the decorative header.
- `font-mono` for the credential ID ensures alignment in any locale.
