// fnv-1a 32-bit — no crypto dependency

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a32(bytes: Uint8Array): number {
  let hash = FNV_OFFSET_BASIS >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i] ?? 0;
    // unsigned 32-bit multiply via imul to avoid floating-point issues
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
}

function toBytes(input: string | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) return input;
  return new TextEncoder().encode(input);
}

// each pass is salted with its index so consecutive passes produce different values
export function hash(input: string | Uint8Array, length = 64): string {
  const bytes = toBytes(input);
  const passes = Math.ceil(length / 8);
  let result = '';
  for (let i = 0; i < passes; i++) {
    const salt = new Uint8Array(bytes.length + 4);
    salt.set(bytes);
    salt[bytes.length] = (i >>> 24) & 0xff;
    salt[bytes.length + 1] = (i >>> 16) & 0xff;
    salt[bytes.length + 2] = (i >>> 8) & 0xff;
    salt[bytes.length + 3] = i & 0xff;
    result += (fnv1a32(salt) >>> 0).toString(16).padStart(8, '0');
  }
  return result.slice(0, length);
}

// 12-char hash — collision-safe enough for asset cache keys and class names
export function shortHash(input: string | Uint8Array): string {
  return hash(input, 12);
}
