# @imprint/sign

PKCS#7 detached digital signatures for
[Imprint](https://github.com/tamimbinhakim/imprint) PDFs.

**License: Business Source License 1.1.** Reverts to Apache-2.0 after four
years. See [`LICENSING.md`](../../LICENSING.md).

```bash
pnpm add @imprint/sign
```

## What it adds

- PKCS#7 detached signatures (`/SubFilter /adbe.pkcs7.detached`).
- Signature widget authoring via the `<Signature>` component in
  `@imprint/react`.
- Self-signed and CA-issued certificate support via `node-forge` (Node) or a
  Rust `rustls-pkcs7` WASM port (browser / edge).
- Visible signature appearance (image + text) or invisible signature.
- Timestamp support (RFC 3161).

## Usage

```tsx
import '@imprint/sign'; // registers the signing writer

const pdf = await renderToBuffer(
  <Document>
    <Page>
      <Form>
        <Signature
          name="director"
          certificate={certPem}
          privateKey={keyPem}
          appearance={{ image: logoUrl, text: 'Signed by Acme Corp' }}
          className="mt-8 h-24 border-b border-gray-300"
        />
      </Form>
    </Page>
  </Document>,
);
```

## Signing after render

For cases where the signing key lives on a separate HSM or signing service,
`@imprint/sign` also exposes `signBuffer` to apply a signature to an already-
rendered PDF:

```ts
import { signBuffer } from '@imprint/sign';

const signed = await signBuffer(unsignedPdf, {
  certificate: certPem,
  privateKey: keyPem,
  reason: 'Document approved',
});
```
