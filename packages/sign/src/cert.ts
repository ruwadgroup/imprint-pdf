import forge from 'node-forge';

export interface CertInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  /** SHA-256 thumbprint of the DER-encoded certificate, uppercase hex. */
  sha256Thumbprint: string;
}

/** Parses a PEM certificate and returns human-readable identity metadata. */
export function parseCertificate(pem: string): CertInfo {
  const cert = forge.pki.certificateFromPem(pem);
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const md = forge.md.sha256.create();
  md.update(der);
  return {
    subject: stringifyAttrs(cert.subject.attributes),
    issuer: stringifyAttrs(cert.issuer.attributes),
    serialNumber: cert.serialNumber,
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
    sha256Thumbprint: md.digest().toHex().toUpperCase(),
  };
}

function stringifyAttrs(attrs: forge.pki.CertificateField[]): string {
  return attrs.map((a) => `${String(a.shortName ?? a.name)}=${String(a.value)}`).join(', ');
}
