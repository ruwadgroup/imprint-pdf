import forge from 'node-forge';

const OID_SHA256 = '2.16.840.1.101.3.4.2.1';
const OID_CONTENT_TYPE = '1.2.840.113549.1.9.3';
const OID_DATA = '1.2.840.113549.1.7.1';
const OID_MSG_DIGEST = '1.2.840.113549.1.9.4';
const OID_SIGNING_TIME = '1.2.840.113549.1.9.5';
const OID_SIGNATURE_TST = '1.2.840.113549.1.9.16.2.14';

export interface SignDataOptions {
  certificate: string;
  privateKey: string;
  /** Optional intermediate / root chain in PEM (concatenated or array). */
  chain?: string[];
  /** RFC 3161 timestamp authority URL. Failures are non-fatal. */
  tsaUrl?: string;
}

/**
 * Builds a CMS / PKCS#7 detached `SignedData` structure over `payload` and
 * returns its DER encoding.
 *
 * Used both by the legacy `signBuffer` trailer mode and by the ISO 32000-2
 * §12.8 ByteRange signing path. The caller is responsible for staging the
 * input bytes — this function does no byte-range arithmetic.
 */
export async function buildSignedData(
  payload: Uint8Array,
  options: SignDataOptions,
): Promise<Uint8Array> {
  const cert = forge.pki.certificateFromPem(options.certificate);
  const key = forge.pki.privateKeyFromPem(options.privateKey);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(toBinaryString(payload));
  p7.addCertificate(cert);

  for (const intermediate of options.chain ?? []) {
    p7.addCertificate(forge.pki.certificateFromPem(intermediate));
  }

  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: OID_SHA256,
    authenticatedAttributes: [
      { type: OID_CONTENT_TYPE, value: OID_DATA },
      { type: OID_MSG_DIGEST },
      { type: OID_SIGNING_TIME, value: utcGeneralizedTime(new Date()) },
    ],
  });

  p7.sign({ detached: true });

  let der: Buffer = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');
  if (options.tsaUrl) {
    try {
      der = await attachTimestamp(der, options.tsaUrl);
    } catch (err) {
      console.warn('[imprint/sign] TSA timestamp failed (signature still valid):', err);
    }
  }
  return Uint8Array.from(der);
}

/**
 * Sends a SHA-256 imprint of the SignedData DER to a TSA, parses the
 * response per RFC 3161, and embeds the returned `TimeStampToken` as an
 * unsigned `id-aa-signatureTimeStampToken` attribute on the first SignerInfo.
 */
async function attachTimestamp(signedDataDer: Buffer, tsaUrl: string): Promise<Buffer> {
  const md = forge.md.sha256.create();
  md.update(signedDataDer.toString('binary'));
  const hashBytes = md.digest().getBytes();

  const tsReq = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.INTEGER,
      false,
      forge.asn1.integerToDer(1).getBytes(),
    ),
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.OID,
          false,
          forge.asn1.oidToDer(OID_SHA256).getBytes(),
        ),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.NULL, false, ''),
      ]),
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OCTETSTRING, false, hashBytes),
    ]),
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.INTEGER,
      false,
      forge.random.getBytesSync(8),
    ),
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.BOOLEAN,
      false,
      String.fromCharCode(0xff),
    ),
  ]);

  const tsReqDer = Buffer.from(forge.asn1.toDer(tsReq).getBytes(), 'binary');
  const response = await fetch(tsaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/timestamp-query' },
    body: tsReqDer,
  });
  if (!response.ok) {
    throw new Error(`TSA returned HTTP ${response.status}: ${response.statusText}`);
  }
  const tsResp = Buffer.from(await response.arrayBuffer());

  const tsRespAsn1 = forge.asn1.fromDer(tsResp.toString('binary'));
  if (!Array.isArray(tsRespAsn1.value) || tsRespAsn1.value.length < 2) {
    throw new Error('TSA response is not a valid TimeStampResp SEQUENCE');
  }
  const token = (tsRespAsn1.value as forge.asn1.Asn1[])[1];
  if (!token) throw new Error('TSA response is missing timeStampToken');

  return embedTimestampToken(signedDataDer, token);
}

function embedTimestampToken(signedDataDer: Buffer, token: forge.asn1.Asn1): Buffer {
  const tstAttr = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
    forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.OID,
      false,
      forge.asn1.oidToDer(OID_SIGNATURE_TST).getBytes(),
    ),
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, [token]),
  ]);

  const sd = forge.asn1.fromDer(signedDataDer.toString('binary'));
  const top = sd.value as forge.asn1.Asn1[];
  if (!Array.isArray(top) || top.length < 2) {
    throw new Error('Unexpected SignedData structure');
  }
  const explicit = top[1] as forge.asn1.Asn1;
  const signedData = (explicit.value as forge.asn1.Asn1[])[0];
  if (!signedData || !Array.isArray(signedData.value)) {
    throw new Error('SignedData inner sequence missing');
  }
  const signerInfos = signedData.value[signedData.value.length - 1] as forge.asn1.Asn1;
  const signerInfo = (signerInfos.value as forge.asn1.Asn1[])[0];
  if (!signerInfo || !Array.isArray(signerInfo.value)) {
    throw new Error('No SignerInfo in SignedData');
  }

  const last = signerInfo.value[signerInfo.value.length - 1] as forge.asn1.Asn1;
  if (last.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && last.type === 1) {
    (last.value as forge.asn1.Asn1[]).push(tstAttr);
  } else {
    const unsigned = forge.asn1.create(forge.asn1.Class.CONTEXT_SPECIFIC, 1, true, [tstAttr]);
    (signerInfo.value as forge.asn1.Asn1[]).push(unsigned);
  }
  return Buffer.from(forge.asn1.toDer(sd).getBytes(), 'binary');
}

function utcGeneralizedTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function toBinaryString(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return s;
}
