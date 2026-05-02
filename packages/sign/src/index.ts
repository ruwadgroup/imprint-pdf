/**
 * @imprint/sign — PKCS#7 detached signatures and AES-256 encryption for
 * Imprint PDFs.
 *
 * Two signing modes are provided:
 *
 *   - `signBuffer` — appends a detached PKCS#7 signature inside an Imprint-
 *     specific trailer (`%IMPRINT_SIG_BEGIN…%IMPRINT_SIG_END`). Suitable
 *     for in-house verification where you control both ends.
 *   - `signWithByteRange` — the ISO 32000-2 §12.8 standard `/ByteRange`
 *     signature accepted by Acrobat, Foxit, Apple Preview, mobile readers,
 *     and EU eIDAS validators.
 *
 * Both modes accept the same `SignDataOptions` (certificate, key, optional
 * RFC 3161 timestamp authority).
 *
 * `encryptDocument` adds AES-256 V=5/R=6 encryption with owner / user
 * passwords and per-flag permissions; `parseCertificate` returns the
 * subject / issuer / SHA-256 thumbprint of a PEM cert.
 *
 * Licensed under the Apache License, Version 2.0.
 */

import { buildSignedData, type SignDataOptions } from './pkcs7.js';

export type { SignWithByteRangeOptions } from './byterange.js';
export { signWithByteRange } from './byterange.js';
export type { CertInfo } from './cert.js';
export { parseCertificate } from './cert.js';
export type { EncryptOptions, PdfPermissions } from './encrypt.js';
export { encryptDocument } from './encrypt.js';
export type { SignDataOptions } from './pkcs7.js';
export { buildSignedData } from './pkcs7.js';

export interface SignOptions extends SignDataOptions {
  reason?: string;
  location?: string;
  /** Page index (0-based) where the signature widget would be placed. Reserved for the v1.0 visible-appearance pass. */
  page?: number;
  /** Signature widget bounding box [x, y, width, height] in points. Reserved for v1.0. */
  rect?: [number, number, number, number];
}

export interface SignatureFieldProps {
  name: string;
  certificate?: string;
  privateKey?: string;
  page?: number;
  rect?: [number, number, number, number];
}

const TRAILER_BEGIN = '\n%IMPRINT_SIG_BEGIN\n';
const TRAILER_END = '\n%IMPRINT_SIG_END\n';

/**
 * Appends a PKCS#7 detached signature to a PDF using Imprint's trailer
 * convention. Use {@link signWithByteRange} for the ISO-standard form
 * recognised by Acrobat and other production readers.
 */
export async function signBuffer(pdf: Uint8Array, options: SignOptions): Promise<Uint8Array> {
  const signature = await buildSignedData(pdf, options);
  const sigB64 = bytesToBase64(signature);
  const trailer = `${TRAILER_BEGIN}${sigB64}${TRAILER_END}`;
  const trailerBytes = new TextEncoder().encode(trailer);
  const out = new Uint8Array(pdf.length + trailerBytes.length);
  out.set(pdf, 0);
  out.set(trailerBytes, pdf.length);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return globalThis.btoa(bin);
}
