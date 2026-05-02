# @imprint-pdf/sign

PKCS#7 detached digital signatures and AES-256 encryption for
[Imprint](https://github.com/tamimbinhakim/imprint-pdf) PDFs.

**License: Apache-2.0.** See [`LICENSING.md`](../../LICENSING.md).

```bash
pnpm add @imprint-pdf/sign
```

## What it adds

- **ISO 32000-2 §12.8 `/ByteRange` signatures** accepted by Acrobat, Foxit,
  Apple Preview, and EU eIDAS validators (`signWithByteRange`).
- **Trailer-comment signatures** for in-house verification pipelines
  (`signBuffer` — simpler but not readable by third-party tools).
- **AES-256 V=5/R=6 encryption** with owner/user passwords and per-flag
  permissions — the only PDF encryption mode considered cryptographically sound
  by ISO 32000-2 (`encryptDocument`).
- **Certificate inspection** — subject, issuer, serial, expiry, SHA-256
  thumbprint (`parseCertificate`).
- **RFC 3161 timestamp authority** support (optional; non-fatal on failure).

## Usage

### Standard ByteRange signature

```ts
import { signWithByteRange } from '@imprint-pdf/sign';

const signed = await signWithByteRange(pdfBytes, {
  certificate: certPem, // PEM string
  privateKey: keyPem, // PEM string
  reason: 'Document approved',
  location: 'Berlin, Germany',
  tsaUrl: 'https://freetsa.org/tsr', // optional RFC 3161 TSA
});
```

### Encrypt before delivery

```ts
import { encryptDocument } from '@imprint-pdf/sign';

const encrypted = await encryptDocument(pdfBytes, {
  ownerPassword: 'secret',
  userPassword: '', // empty = open without prompt
  permissions: { print: true, modify: false, copy: false, annotate: true },
});
```

### Inspect a certificate

```ts
import { parseCertificate } from '@imprint-pdf/sign';

const info = parseCertificate(certPem);
console.log(info.subject, info.sha256Thumbprint, info.notAfter);
```

### Trailer-comment signature (in-house only)

```ts
import { signBuffer } from '@imprint-pdf/sign';

const signed = await signBuffer(pdfBytes, {
  certificate: certPem,
  privateKey: keyPem,
});
// output contains %IMPRINT_SIG_BEGIN … %IMPRINT_SIG_END
```
