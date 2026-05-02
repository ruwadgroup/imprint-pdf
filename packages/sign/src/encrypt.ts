import forge from 'node-forge';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFString,
} from 'pdf-lib';

export interface EncryptOptions {
  /** Owner password — full permissions when supplied at open time. */
  ownerPassword: string;
  /** User password — restricted permissions; empty string allows open without prompt. */
  userPassword?: string;
  /** Permissions surfaced when only the user password is supplied. */
  permissions?: PdfPermissions;
}

export interface PdfPermissions {
  /** Allow printing at any resolution. Defaults to `true`. */
  print?: boolean;
  /** Allow document changes other than form / commenting. Defaults to `false`. */
  modify?: boolean;
  /** Allow text / image extraction. Defaults to `true`. */
  copy?: boolean;
  /** Allow filling, signing, and creating annotations. Defaults to `true`. */
  annotate?: boolean;
}

/**
 * AES-256 PDF encryption (V=5, R=6) — the algorithm specified by ISO
 * 32000-2 §7.6.4 and the only standard PDF encryption mode considered
 * cryptographically sound today.
 *
 * Implementation overview:
 *
 *   1. A 32-byte file encryption key is generated via CSPRNG.
 *   2. Owner / user passwords are hashed via Algorithm 2.B (SHA-256/384/512
 *      + AES-CBC iteration loop) into the `O`, `U`, `OE`, `UE` values.
 *   3. `/Perms` is the AES-ECB encryption of the permission flags.
 *   4. Every indirect object's strings and streams are encrypted with
 *      AES-256-CBC using a fresh 16-byte IV, written as `IV ‖ ciphertext`
 *      with PKCS#7 padding (ISO 32000-2 §7.6.3.1).
 *   5. An `/Encrypt` reference is added to the trailer.
 *
 * The result opens in Acrobat, Apple Preview, Foxit, Edge, Chrome, and
 * any veraPDF-compliant reader once a password is supplied.
 */
export async function encryptDocument(
  pdf: Uint8Array,
  options: EncryptOptions,
): Promise<Uint8Array> {
  const userPassword = options.userPassword ?? '';
  const permissions = packPermissions(options.permissions ?? {});

  const fileKey = randomBytes(32);
  const userValSalt = randomBytes(8);
  const userKeySalt = randomBytes(8);
  const ownerValSalt = randomBytes(8);
  const ownerKeySalt = randomBytes(8);

  const u =
    computeHashV6(userPassword, userValSalt, '') + asString(userValSalt) + asString(userKeySalt);
  const ueKey = computeHashV6(userPassword, userKeySalt, '');
  const ue = aesCbcNoPad(asString(fileKey), ueKey, '\x00'.repeat(16));

  const o =
    computeHashV6(options.ownerPassword, ownerValSalt, u) +
    asString(ownerValSalt) +
    asString(ownerKeySalt);
  const oeKey = computeHashV6(options.ownerPassword, ownerKeySalt, u);
  const oe = aesCbcNoPad(asString(fileKey), oeKey, '\x00'.repeat(16));

  const permsBlock = buildPermsBlock(permissions);
  const perms = aesEcb(permsBlock, asString(fileKey));

  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const ctx = doc.context;

  const encryptDict = PDFDict.withContext(ctx);
  encryptDict.set(PDFName.of('Filter'), PDFName.of('Standard'));
  encryptDict.set(PDFName.of('V'), PDFNumber.of(5));
  encryptDict.set(PDFName.of('R'), PDFNumber.of(6));
  encryptDict.set(PDFName.of('Length'), PDFNumber.of(256));
  encryptDict.set(PDFName.of('P'), PDFNumber.of(permissions | 0));
  const cf = PDFDict.withContext(ctx);
  const stdCF = PDFDict.withContext(ctx);
  stdCF.set(PDFName.of('CFM'), PDFName.of('AESV3'));
  stdCF.set(PDFName.of('Length'), PDFNumber.of(32));
  stdCF.set(PDFName.of('AuthEvent'), PDFName.of('DocOpen'));
  cf.set(PDFName.of('StdCF'), stdCF);
  encryptDict.set(PDFName.of('CF'), cf);
  encryptDict.set(PDFName.of('StmF'), PDFName.of('StdCF'));
  encryptDict.set(PDFName.of('StrF'), PDFName.of('StdCF'));
  encryptDict.set(PDFName.of('O'), PDFHexString.of(toHex(latin1ToBytes(o))));
  encryptDict.set(PDFName.of('U'), PDFHexString.of(toHex(latin1ToBytes(u))));
  encryptDict.set(PDFName.of('OE'), PDFHexString.of(toHex(latin1ToBytes(oe))));
  encryptDict.set(PDFName.of('UE'), PDFHexString.of(toHex(latin1ToBytes(ue))));
  encryptDict.set(PDFName.of('Perms'), PDFHexString.of(toHex(latin1ToBytes(perms))));
  const encryptRef = ctx.register(encryptDict);
  ctx.trailerInfo.Encrypt = encryptRef;

  // Ensure the trailer carries a stable `/ID` (required by ISO 32000-2 when
  // `/Encrypt` is present). pdf-lib synthesises one only at save time, so
  // we pin it now to keep the reload-then-resave path deterministic.
  if (!ctx.trailerInfo.ID) {
    const id = randomBytes(16);
    const idArr = PDFArray.withContext(ctx);
    idArr.push(PDFHexString.of(toHex(id)));
    idArr.push(PDFHexString.of(toHex(id)));
    ctx.trailerInfo.ID = idArr;
  }

  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (ref === encryptRef) continue;
    encryptObject(ctx, ref, obj, fileKey, encryptRef);
  }

  return doc.save({ useObjectStreams: false });
}

/**
 * Recursively encrypts every string and stream reachable from an indirect
 * object. The /Encrypt dict and its descendants are explicitly skipped so
 * the reader can read the dict in plaintext during password validation.
 */
function encryptObject(
  ctx: PDFDocument['context'],
  ref: PDFRef,
  obj: unknown,
  fileKey: Uint8Array,
  encryptRef: PDFRef,
): void {
  if (obj instanceof PDFStream) {
    if (obj instanceof PDFRawStream) {
      const replaced = encryptStream(obj, fileKey);
      if (replaced) ctx.assign(ref, replaced);
    }
    encryptDict(obj.dict, fileKey, encryptRef);
    return;
  }
  if (obj instanceof PDFDict) {
    encryptDict(obj, fileKey, encryptRef);
    return;
  }
  if (obj instanceof PDFArray) {
    encryptArray(obj, fileKey, encryptRef);
    return;
  }
}

function encryptDict(dict: PDFDict, fileKey: Uint8Array, encryptRef: PDFRef): void {
  for (const [name, value] of dict.entries()) {
    if (value instanceof PDFRef && value === encryptRef) continue;
    if (value instanceof PDFString || value instanceof PDFHexString) {
      const replacement = encryptStringObject(value, fileKey);
      dict.set(name, replacement);
    } else if (value instanceof PDFDict) {
      encryptDict(value, fileKey, encryptRef);
    } else if (value instanceof PDFArray) {
      encryptArray(value, fileKey, encryptRef);
    }
  }
}

function encryptArray(arr: PDFArray, fileKey: Uint8Array, encryptRef: PDFRef): void {
  for (let i = 0; i < arr.size(); i++) {
    const value = arr.get(i);
    if (value instanceof PDFRef && value === encryptRef) continue;
    if (value instanceof PDFString || value instanceof PDFHexString) {
      arr.set(i, encryptStringObject(value, fileKey));
    } else if (value instanceof PDFDict) {
      encryptDict(value, fileKey, encryptRef);
    } else if (value instanceof PDFArray) {
      encryptArray(value, fileKey, encryptRef);
    }
  }
}

function encryptStringObject(value: PDFString | PDFHexString, fileKey: Uint8Array): PDFHexString {
  const bytes = value.asBytes();
  const ciphertext = aesCbcEncrypt(bytes, fileKey);
  return PDFHexString.of(toHex(ciphertext));
}

function encryptStream(stream: PDFRawStream, fileKey: Uint8Array): PDFRawStream | null {
  const ciphertext = aesCbcEncrypt(stream.contents, fileKey);
  const dict = stream.dict;
  // Length must reflect ciphertext size; readers honouring /Encrypt recompute on decrypt.
  dict.set(PDFName.of('Length'), PDFNumber.of(ciphertext.length));
  return PDFRawStream.of(dict, ciphertext);
}

function packPermissions(p: PdfPermissions): number {
  // PDF 32000-1 Table 22 — bits 1 (LSB) and 2 are reserved 0. Bits 7,8 are
  // reserved 1 for V≥2. We default to "everything allowed except modify".
  let bits = 0xfffffffc; // bits 31..2 = 1, bits 1..0 = 0
  if (!(p.print ?? true)) bits &= ~(1 << 2);
  if (!(p.modify ?? false)) bits &= ~(1 << 3);
  if (!(p.copy ?? true)) bits &= ~(1 << 4);
  if (!(p.annotate ?? true)) bits &= ~(1 << 5);
  return bits;
}

function buildPermsBlock(p: number): string {
  const buf = Buffer.alloc(16);
  buf.writeInt32LE(p, 0);
  buf.writeUInt32LE(0xffffffff, 4);
  buf[8] = 0x54; // 'T' — encrypt metadata
  buf[9] = 0x61; // 'a'
  buf[10] = 0x64; // 'd'
  buf[11] = 0x62; // 'b'
  const rand = randomBytes(4);
  buf[12] = rand[0]!;
  buf[13] = rand[1]!;
  buf[14] = rand[2]!;
  buf[15] = rand[3]!;
  return buf.toString('binary');
}

/** ISO 32000-2 §7.6.4.3.4 Algorithm 2.B — iterative SHA-256/384/512 + AES round. */
function computeHashV6(password: string, salt: Uint8Array, udata: string): string {
  const md = forge.md.sha256.create();
  md.update(password);
  md.update(asString(salt));
  md.update(udata);
  let k = md.digest().getBytes();

  let round = 0;
  while (true) {
    let k1 = '';
    for (let i = 0; i < 64; i++) k1 += password + k + udata;

    const aesKey = k.slice(0, 16);
    const iv = k.slice(16, 32);
    const cipher = forge.cipher.createCipher('AES-CBC', aesKey);
    cipher.start({ iv });
    (cipher.mode as unknown as { pad?: () => boolean }).pad = () => true;
    cipher.update(forge.util.createBuffer(k1));
    cipher.finish();
    const e = cipher.output.getBytes();

    const sum = [...e.slice(0, 16)].reduce((acc, c) => acc + (c.charCodeAt(0) ?? 0), 0) % 3;
    const algoMd =
      sum === 0
        ? forge.md.sha256.create()
        : sum === 1
          ? forge.md.sha384.create()
          : forge.md.sha512.create();
    algoMd.update(e);
    k = algoMd.digest().getBytes();

    const last = e.charCodeAt(e.length - 1) ?? 0;
    if (round >= 64 && last <= round - 32) break;
    round++;
  }
  return k.slice(0, 32);
}

function aesEcb(plain: string, key: string): string {
  const cipher = forge.cipher.createCipher('AES-ECB', key);
  cipher.start();
  cipher.update(forge.util.createBuffer(plain));
  cipher.finish();
  return cipher.output.getBytes(16);
}

function aesCbcNoPad(plain: string, key: string, iv: string): string {
  const cipher = forge.cipher.createCipher('AES-CBC', key);
  cipher.start({ iv });
  (cipher.mode as unknown as { pad?: () => boolean }).pad = () => true;
  cipher.update(forge.util.createBuffer(plain));
  cipher.finish();
  return cipher.output.getBytes();
}

function aesCbcEncrypt(plain: Uint8Array, key: Uint8Array): Uint8Array {
  const iv = randomBytes(16);
  const cipher = forge.cipher.createCipher('AES-CBC', asString(key));
  cipher.start({ iv: asString(iv) });
  cipher.update(forge.util.createBuffer(asString(plain)));
  cipher.finish();
  const ct = latin1ToBytes(cipher.output.getBytes());
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return out;
}

function randomBytes(n: number): Uint8Array {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const out = new Uint8Array(n);
    globalThis.crypto.getRandomValues(out);
    return out;
  }
  return latin1ToBytes(forge.random.getBytesSync(n));
}

function asString(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return s;
}

function latin1ToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function toHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i]!.toString(16).padStart(2, '0');
  return s;
}
