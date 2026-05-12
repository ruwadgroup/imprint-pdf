# Forms (AcroForms)

imprint-pdf authors interactive PDF forms as JSX. The renderer creates `pdf-lib`
`PDFForm` objects from the same layout pass that computes visual geometry —
widget rectangles are exact.

XFA is explicitly **not supported**. XFA is deprecated in PDF 2.0 and disallowed
in PDF/A. AcroForms are sufficient for every real-world use case.

## Basic form

```tsx
import {
  Document,
  Page,
  Form,
  TextField,
  Checkbox,
  Signature,
} from '@imprint-pdf/react';

export function ApplicationForm() {
  return (
    <Document>
      <Page size="A4" className="p-12 font-sans">
        <h1 className="text-xl font-bold">Application Form</h1>

        <Form name="application">
          <label className="block mt-6 text-sm font-medium">
            Full name
            <TextField
              name="name"
              required
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="block mt-4 text-sm font-medium">
            Email
            <TextField
              name="email"
              type="email"
              required
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="flex items-center gap-2 mt-6 text-sm">
            <Checkbox name="agree" required className="h-4 w-4" />I agree to the
            terms and conditions.
          </label>

          <Signature
            name="applicant"
            className="mt-8 h-24 w-full border-b-2 border-gray-400"
          />

          <Button
            name="submit"
            action={{ type: 'submitForm', url: 'https://acme.com/submit' }}
            className="mt-8 bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium"
          >
            Submit
          </Button>
        </Form>
      </Page>
    </Document>
  );
}
```

## Components

### `<Form>`

Container for AcroForm fields.

```tsx
<Form name="formName">…</Form>
```

### `<TextField>`

Single-line or multi-line text input.

```tsx
<TextField
  name="customer.name"
  required
  multiline // multi-line text area
  maxLength={200}
  defaultValue="Type here…"
  className="…"
/>
```

### `<Checkbox>`

```tsx
<Checkbox name="agree" defaultChecked={false} className="h-4 w-4" />
```

### `<RadioGroup>`

```tsx
<RadioGroup
  name="plan"
  options={[
    { value: 'basic', label: 'Basic' },
    { value: 'pro', label: 'Pro' },
  ]}
  defaultValue="basic"
  className="flex gap-4"
/>
```

### `<Dropdown>`

```tsx
<Dropdown
  name="country"
  options={countries.map((c) => ({ value: c.code, label: c.name }))}
  className="w-full border rounded px-3 py-2 text-sm"
/>
```

### `<Signature>`

Widget for a drawn digital signature. For cryptographic PKCS#7 signing, add the
`certificate` and `privateKey` props (requires `@imprint-pdf/sign`).

```tsx
<Signature name="director" className="h-24 w-full border-b border-gray-400" />
```

### `<Button>`

Submit, reset, or custom JavaScript action button.

```tsx
<Button
  name="submit"
  action={{ type: 'submitForm', url: 'https://…' }}
  className="bg-blue-600 text-white px-6 py-2 rounded"
>
  Submit
</Button>
```

Supported action types: `submitForm`, `resetForm`, `importData`, `JavaScript`.
Note: JavaScript actions (`type: 'JavaScript'`) run only in Adobe Acrobat and
PDF.js — not all PDF viewers.

## Field appearance

Field appearance (background, border, text color, font) is controlled by the
`className` prop, resolved through the Tailwind pipeline. Fields inherit
document fonts — set `font-sans` or `font-serif` on the nearest parent.

## Flattening forms

To render a filled-in form as a non-interactive PDF (flatten the fields into the
page content), pass `{ flattenForms: true }` to `pdf()`.
