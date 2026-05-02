import forge from 'node-forge';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { signWithByteRange } from './byterange.js';
import { encryptDocument } from './encrypt.js';
import { parseCertificate, signBuffer } from './index.js';

function generateTestCredentials(): { certPem: string; keyPem: string } {
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const attrs = [
    { name: 'commonName', value: 'Imprint Test' },
    { name: 'organizationName', value: 'Imprint' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

async function blankPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 300]);
  return doc.save();
}

describe('parseCertificate', () => {
  it('parses a valid PEM and returns identity metadata', () => {
    const { certPem } = generateTestCredentials();
    const info = parseCertificate(certPem);
    expect(info.subject).toContain('CN=Imprint Test');
    expect(info.issuer).toContain('CN=Imprint Test');
    expect(info.sha256Thumbprint).toMatch(/^[0-9A-F]{64}$/);
    expect(info.notAfter.getTime()).toBeGreaterThan(Date.now());
  });

  it('throws on invalid PEM', () => {
    expect(() => parseCertificate('not-a-cert')).toThrow();
  });
});

describe('signBuffer', () => {
  it('appends a verifiable PKCS#7 trailer', async () => {
    const { certPem, keyPem } = generateTestCredentials();
    const pdf = await blankPdf();
    const signed = await signBuffer(pdf, { certificate: certPem, privateKey: keyPem });

    const text = new TextDecoder().decode(signed);
    expect(text).toContain('%IMPRINT_SIG_BEGIN');
    expect(text).toContain('%IMPRINT_SIG_END');
    expect(signed.length).toBeGreaterThan(pdf.length);
  });
});

describe('signWithByteRange', () => {
  it('embeds an ISO 32000-2 detached signature with a valid /ByteRange', async () => {
    const { certPem, keyPem } = generateTestCredentials();
    const pdf = await blankPdf();
    const signed = await signWithByteRange(pdf, {
      certificate: certPem,
      privateKey: keyPem,
      reason: 'unit test',
    });

    const text = new TextDecoder('latin1').decode(signed);
    expect(text).toContain('/Type /Sig');
    expect(text).toContain('/SubFilter /adbe.pkcs7.detached');
    expect(text).toContain('/ByteRange [0 ');
    expect(text).toContain('/AcroForm');
    expect(text).toContain('startxref');
    expect(text.endsWith('%%EOF\n')).toBe(true);
  });
});

describe('encryptDocument', () => {
  it('attaches an /Encrypt dict, /ID, and AES-256-V=5 cipher metadata', async () => {
    const pdf = await blankPdf();
    const encrypted = await encryptDocument(pdf, {
      ownerPassword: 'owner-secret',
      userPassword: 'user',
      permissions: { print: true, modify: false, copy: false, annotate: true },
    });

    expect(encrypted.length).toBeGreaterThan(pdf.length);
    const tail = new TextDecoder('latin1').decode(encrypted);
    expect(tail).toContain('/Filter /Standard');
    expect(tail).toContain('/V 5');
    expect(tail).toContain('/R 6');
    expect(tail).toContain('/CFM /AESV3');
    expect(tail).toMatch(/\/ID \[/);
  });

  it('produces a different ciphertext on every run (random IV/keys)', async () => {
    const pdf = await blankPdf();
    const a = await encryptDocument(pdf, { ownerPassword: 'pw' });
    const b = await encryptDocument(pdf, { ownerPassword: 'pw' });
    expect(a).not.toEqual(b);
  });
});
