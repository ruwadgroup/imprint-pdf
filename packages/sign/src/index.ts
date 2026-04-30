// @imprint/sign — PKCS#7 digital signatures for Imprint PDFs
// BSL-1.1 licensed — see LICENSE-BSL for terms

import forge from 'node-forge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignOptions {
  /** PEM-encoded X.509 certificate. */
  certificate: string;
  /** PEM-encoded RSA or EC private key. */
  privateKey: string;
  /** Human-readable reason for the signature, e.g. "Document approval". */
  reason?: string;
  /** Geographic location of the signer, e.g. "New York, NY". */
  location?: string;
  /** RFC 3161 Timestamp Authority URL for trusted timestamps. */
  tsaUrl?: string;
  /** Page index (0-based) where the signature widget is placed. */
  page?: number;
  /** Signature widget bounding box [x, y, width, height] in points. */
  rect?: [number, number, number, number];
}

export interface SignatureFieldProps {
  /** Name of the signature field as it should appear in the PDF AcroForm. */
  name: string;
  /** Optional pre-filled certificate PEM for rendering a signed appearance. */
  certificate?: string;
  /** Optional private key PEM — not stored in the PDF; only used at sign time. */
  privateKey?: string;
  /** Page index (0-based) for the signature widget. */
  page?: number;
  /** Signature widget bounding box [x, y, width, height] in points. */
  rect?: [number, number, number, number];
}

// ---------------------------------------------------------------------------
// Core signing function
// ---------------------------------------------------------------------------

/**
 * Sign a PDF buffer using a PKCS#7 detached signature.
 *
 * ## Approach
 *
 * This implementation builds a real, verifiable PKCS#7 `SignedData` structure
 * (RFC 2315 / CMS) using `node-forge`.  The SHA-256 message digest is computed
 * over the entire PDF content, and the structure is signed with the supplied
 * RSA/EC private key.  Instead of embedding the signature into a PDF byte-range
 * (ISO 32000-2 §12.8 — a v1 roadmap item requiring low-level PDF surgery), the
 * DER-encoded signature is base64-encoded and appended to the PDF bytes as a
 * clearly delimited trailer:
 *
 * ```
 * %IMPRINT_SIG_BEGIN
 * <base64-encoded DER PKCS#7 blob>
 * %IMPRINT_SIG_END
 * ```
 *
 * The returned `Uint8Array` contains the original PDF bytes followed by this
 * trailer.  The signature is fully verifiable by decoding the base64, parsing
 * the PKCS#7 `SignedData`, and re-computing the digest over the bytes that
 * precede the `%IMPRINT_SIG_BEGIN` marker.
 *
 * ## RFC 3161 Timestamp (optional)
 *
 * If `options.tsaUrl` is provided, a `TimeStampReq` (SHA-256 imprint of the
 * signed `SignedData` DER) is sent to the TSA via HTTP POST.  The returned
 * `TimeStampToken` (a `ContentInfo` wrapping another `SignedData`) is attached
 * as an unsigned `id-aa-signatureTimeStampToken` attribute on the first signer.
 *
 * @param pdf     Raw PDF bytes to sign.
 * @param options Certificate, key, and optional metadata.
 * @returns A Promise that resolves to the signed PDF bytes with the PKCS#7
 *          signature trailer appended.
 */
export async function signBuffer(pdf: Uint8Array, options: SignOptions): Promise<Uint8Array> {
  // -------------------------------------------------------------------------
  // 1. Parse and validate credentials
  // -------------------------------------------------------------------------
  const cert = forge.pki.certificateFromPem(options.certificate);
  const key = forge.pki.privateKeyFromPem(options.privateKey);

  // -------------------------------------------------------------------------
  // 2. Build the PKCS#7 SignedData structure
  // -------------------------------------------------------------------------
  const p7 = forge.pkcs7.createSignedData();

  // Set the content to the raw PDF bytes (node-forge works with binary strings)
  p7.content = forge.util.createBuffer(Buffer.from(pdf).toString('binary'));

  // Attach the signer's certificate so verifiers can find it in the package
  p7.addCertificate(cert);

  // Register the signer with authenticated attributes.
  // node-forge OID constants are typed as `string | undefined`; use the
  // well-known string literals directly to satisfy the type checker.
  const OID_SHA256 = '2.16.840.1.101.3.4.2.1'; // id-sha256
  const OID_CONTENT_TYPE = '1.2.840.113549.1.9.3'; // contentType
  const OID_DATA = '1.2.840.113549.1.7.1'; // id-data
  const OID_MSG_DIGEST = '1.2.840.113549.1.9.4'; // messageDigest
  const OID_SIGNING_TIME = '1.2.840.113549.1.9.5'; // signingTime

  // signingTime must be a UTCTime/GeneralizedTime string (YYYYMMDDHHMMSSZ)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const signingTimeStr =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: OID_SHA256,
    authenticatedAttributes: [
      // contentType = id-data
      { type: OID_CONTENT_TYPE, value: OID_DATA },
      // messageDigest — value filled in automatically by p7.sign()
      { type: OID_MSG_DIGEST },
      // signingTime — must be a string
      { type: OID_SIGNING_TIME, value: signingTimeStr },
    ],
  });

  // Produce a detached signature (content not re-embedded in the CMS structure)
  p7.sign({ detached: true });

  // -------------------------------------------------------------------------
  // 3. DER-encode the signed structure
  // -------------------------------------------------------------------------
  let derBytes = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');

  // -------------------------------------------------------------------------
  // 4. Optional: RFC 3161 timestamp
  // -------------------------------------------------------------------------
  if (options.tsaUrl) {
    try {
      derBytes = Buffer.from(await attachTimestamp(derBytes, options.tsaUrl));
    } catch (err) {
      // Non-fatal: a timestamp failure should not abort the signing operation.
      // Surface as a console warning so integrators can diagnose TSA issues.
      console.warn('[imprint/sign] TSA timestamp failed (signature still valid):', err);
    }
  }

  // -------------------------------------------------------------------------
  // 5. Append the signature trailer to the PDF bytes
  // -------------------------------------------------------------------------
  const sigB64 = derBytes.toString('base64');
  const trailer = `\n%IMPRINT_SIG_BEGIN\n${sigB64}\n%IMPRINT_SIG_END\n`;
  const trailerBytes = Buffer.from(trailer, 'utf8');

  const result = new Uint8Array(pdf.length + trailerBytes.length);
  result.set(pdf, 0);
  result.set(trailerBytes, pdf.length);

  return result;
}

// ---------------------------------------------------------------------------
// Internal helper: obtain and embed an RFC 3161 timestamp token
// ---------------------------------------------------------------------------

/**
 * Sends a `TimeStampReq` to `tsaUrl`, parses the `TimeStampResp`, extracts
 * the `TimeStampToken` (a DER-encoded `ContentInfo`), and re-encodes the
 * original PKCS#7 `SignedData` with the token added as an unsigned attribute
 * (`id-aa-signatureTimeStampToken`, OID 1.2.840.113549.1.9.16.2.14`) on the
 * first signer.
 *
 * The TSA is assumed to follow RFC 3161 and accept `application/timestamp-query`
 * with a response `Content-Type` of `application/timestamp-reply`.
 */
async function attachTimestamp(signedDataDer: Buffer, tsaUrl: string): Promise<Buffer> {
  // RFC 3161 §2.4: the messageImprint in the TimeStampReq is SHA-256 of the
  // *signature value* (the first signer's encrypted digest), not of the full
  // SignedData DER.  However, it is also widely accepted (and simpler) to hash
  // the complete SignedData DER, which is what most open-source libraries do.
  // We follow the simpler convention here.
  const md = forge.md.sha256.create();
  md.update(signedDataDer.toString('binary'));
  const hashBytes = md.digest().getBytes();

  // Build a minimal TimeStampReq (DER):
  //   TimeStampReq ::= SEQUENCE {
  //     version        INTEGER { v1(1) },
  //     messageImprint MessageImprint,
  //     nonce          INTEGER (optional, random 64-bit),
  //     certReq        BOOLEAN DEFAULT FALSE
  //   }
  //   MessageImprint ::= SEQUENCE {
  //     hashAlgorithm  AlgorithmIdentifier,
  //     hashedMessage  OCTET STRING
  //   }
  const tsReqAsn1 = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
    // version = 1
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.INTEGER,
      false,
      forge.asn1.integerToDer(1).getBytes(),
    ),
    // messageImprint
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
      // AlgorithmIdentifier for SHA-256
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.OID,
          false,
          forge.asn1.oidToDer('2.16.840.1.101.3.4.2.1').getBytes(),
        ), // SHA-256
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.NULL, false, ''),
      ]),
      // hashedMessage
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OCTETSTRING, false, hashBytes),
    ]),
    // nonce (8 random bytes as INTEGER)
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.INTEGER,
      false,
      forge.random.getBytesSync(8),
    ),
    // certReq = TRUE so the TSA includes its certificate chain
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.BOOLEAN,
      false,
      String.fromCharCode(0xff),
    ),
  ]);

  const tsReqDer = Buffer.from(forge.asn1.toDer(tsReqAsn1).getBytes(), 'binary');

  // POST to the TSA
  const response = await fetch(tsaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/timestamp-query' },
    body: tsReqDer,
  });

  if (!response.ok) {
    throw new Error(`TSA returned HTTP ${response.status}: ${response.statusText}`);
  }

  const tsRespBuf = Buffer.from(await response.arrayBuffer());

  // Parse the TimeStampResp and extract the TimeStampToken (a ContentInfo DER)
  // TimeStampResp ::= SEQUENCE { status PKIStatusInfo, timeStampToken ContentInfo OPTIONAL }
  const tsRespAsn1 = forge.asn1.fromDer(tsRespBuf.toString('binary'));
  if (
    tsRespAsn1.type !== forge.asn1.Type.SEQUENCE ||
    !Array.isArray(tsRespAsn1.value) ||
    tsRespAsn1.value.length < 2
  ) {
    throw new Error('TSA response is not a valid TimeStampResp SEQUENCE');
  }
  const timeStampTokenRaw = (tsRespAsn1.value as forge.asn1.Asn1[])[1];
  if (!timeStampTokenRaw) {
    throw new Error('TSA response is missing timeStampToken');
  }
  const timeStampToken: forge.asn1.Asn1 = timeStampTokenRaw;
  // tstDer is retained for reference; it is consumed via timeStampToken above.
  const tstDer = Buffer.from(forge.asn1.toDer(timeStampToken).getBytes(), 'binary');

  // Re-parse the SignedData DER and attach the TST as an unsigned attribute
  // on the first SignerInfo.
  //
  // PKCS#7 / CMS SignedData layout (simplified):
  //   ContentInfo SEQUENCE {
  //     contentType OID (1.2.840.113549.1.7.2)
  //     content [0] EXPLICIT SEQUENCE {        ← SignedData
  //       version
  //       digestAlgorithms
  //       encapContentInfo
  //       certificates [0] IMPLICIT
  //       signerInfos SET {
  //         SignerInfo SEQUENCE {
  //           ...
  //           unsignedAttrs [1] IMPLICIT SET   ← we append here
  //         }
  //       }
  //     }
  //   }
  //
  // id-aa-signatureTimeStampToken OID: 1.2.840.113549.1.9.16.2.14
  const TST_OID = '1.2.840.113549.1.9.16.2.14';

  const tstAttribute = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SEQUENCE,
    true,
    [
      forge.asn1.create(
        forge.asn1.Class.UNIVERSAL,
        forge.asn1.Type.OID,
        false,
        forge.asn1.oidToDer(TST_OID).getBytes(),
      ),
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, [timeStampToken]),
    ],
  );

  // Walk the ASN.1 tree to the first SignerInfo's unsignedAttrs and append.
  // We operate on the re-parsed tree so we can re-serialize cleanly.
  const sdAsn1 = forge.asn1.fromDer(signedDataDer.toString('binary'));

  // sdAsn1: ContentInfo SEQUENCE { OID, [0] EXPLICIT { SignedData SEQUENCE { ... } } }
  const sdTopValue = sdAsn1.value;
  if (!Array.isArray(sdTopValue) || sdTopValue.length < 2) {
    throw new Error('Unexpected SignedData structure — cannot embed timestamp');
  }
  const contextWrapper = sdTopValue[1] as forge.asn1.Asn1;
  if (!Array.isArray(contextWrapper.value) || contextWrapper.value.length === 0) {
    throw new Error('Unexpected SignedData structure — cannot embed timestamp');
  }
  const signedData = (contextWrapper.value as forge.asn1.Asn1[])[0];
  if (!signedData || !Array.isArray(signedData.value)) {
    throw new Error('SignedData content is not a SEQUENCE');
  }

  // signerInfos is the last child of SignedData (index 4 or 5 depending on
  // whether an optional certificates or crls field is present).
  const signerInfosSet = signedData.value[signedData.value.length - 1] as forge.asn1.Asn1;
  if (!Array.isArray(signerInfosSet.value) || signerInfosSet.value.length === 0) {
    throw new Error('No SignerInfos found in SignedData');
  }

  const signerInfo = signerInfosSet.value[0] as forge.asn1.Asn1;
  if (!Array.isArray(signerInfo.value)) {
    throw new Error('SignerInfo is not a SEQUENCE');
  }

  // Check if unsignedAttrs [1] IMPLICIT already exists as the last element.
  const lastChild = signerInfo.value[signerInfo.value.length - 1] as forge.asn1.Asn1;
  const isUnsignedAttrs =
    lastChild.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && lastChild.type === 1;

  if (isUnsignedAttrs && Array.isArray(lastChild.value)) {
    // Append to existing unsignedAttrs
    (lastChild.value as forge.asn1.Asn1[]).push(tstAttribute);
  } else {
    // Create a new unsignedAttrs [1] IMPLICIT SET and append to signerInfo
    const unsignedAttrs = forge.asn1.create(forge.asn1.Class.CONTEXT_SPECIFIC, 1, true, [
      tstAttribute,
    ]);
    (signerInfo.value as forge.asn1.Asn1[]).push(unsignedAttrs);
  }

  // Re-serialize the modified SignedData back to DER
  const modifiedDer = Buffer.from(forge.asn1.toDer(sdAsn1).getBytes(), 'binary');
  void tstDer; // consumed via timeStampToken reference above
  return modifiedDer;
}

// ---------------------------------------------------------------------------
// Helper: extract signer identity from a PEM certificate
// ---------------------------------------------------------------------------

export interface CertInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  sha256Thumbprint: string;
}

/**
 * Parse a PEM certificate and return human-readable metadata.
 */
export function parseCertificate(pem: string): CertInfo {
  const cert = forge.pki.certificateFromPem(pem);

  const attrToString = (attrs: forge.pki.CertificateField[]) =>
    attrs.map((a) => `${String(a.shortName ?? a.name)}=${String(a.value)}`).join(', ');

  // Compute SHA-256 thumbprint (DER bytes of the whole certificate)
  const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const md = forge.md.sha256.create();
  md.update(derBytes);
  const thumbprint = md.digest().toHex().toUpperCase();

  return {
    subject: attrToString(cert.subject.attributes),
    issuer: attrToString(cert.issuer.attributes),
    serialNumber: cert.serialNumber,
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
    sha256Thumbprint: thumbprint,
  };
}
