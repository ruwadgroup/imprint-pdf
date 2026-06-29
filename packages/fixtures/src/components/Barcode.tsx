/**
 * Dependency-free, deterministic visual barcode and QR-style block.
 *
 * These are *not* spec-accurate Code128 / QR encoders - they deterministically
 * derive a stable bar/cell pattern from the input string so fixtures render a
 * realistic-looking, byte-identical mark every time (no RNG). For a
 * real scannable code, swap in a proper encoder in the consuming app.
 */

// Cheap, stable string hash → 32-bit unsigned int.
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic bit stream of `count` bits derived from `value`.
function bits(value: string, count: number): boolean[] {
  const out: boolean[] = [];
  let h = hash(value);
  for (let i = 0; i < count; i++) {
    // xorshift to keep mixing without random
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    out.push(((h >>> (i % 31)) & 1) === 1);
  }
  return out;
}

export interface BarcodeProps {
  /** Value to encode (visually). */
  value: string;
  /** Total width in pt. */
  width?: number;
  /** Height in pt. */
  height?: number;
  className?: string;
}

export function Barcode({ value, width = 200, height = 48, className = '' }: BarcodeProps) {
  const bars = bits(value, 48);
  const barWidth = width / bars.length;
  return (
    <div className={`flex flex-row items-end ${className}`} style={{ width, height }}>
      {bars.map((on, i) => (
        <div
          key={i}
          className={on ? 'bg-black' : 'bg-white'}
          style={{ width: barWidth, height: on ? height : height * 0.82 }}
        />
      ))}
    </div>
  );
}

export interface QrCodeProps {
  /** Value to encode (visually). */
  value: string;
  /** Pixel size of the square in pt. */
  size?: number;
  /** Module grid dimension (modules per side). */
  modules?: number;
  className?: string;
}

export function QrCode({ value, size = 96, modules = 21, className = '' }: QrCodeProps) {
  const cells = bits(value, modules * modules);
  const cell = size / modules;
  // Three finder-pattern corners, drawn deterministically over the noise.
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, modules - 7) || inBox(modules - 7, 0);
  };
  const finderOn = (r: number, c: number) => {
    const local = (br: number, bc: number) => {
      const lr = r - br;
      const lc = c - bc;
      const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6;
      const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
      return ring || core;
    };
    if (r < 7 && c < 7) return local(0, 0);
    if (r < 7 && c >= modules - 7) return local(0, modules - 7);
    if (r >= modules - 7 && c < 7) return local(modules - 7, 0);
    return false;
  };
  return (
    <div className={`flex flex-col ${className}`} style={{ width: size, height: size }}>
      {Array.from({ length: modules }).map((_, r) => (
        <div key={r} className="flex flex-row" style={{ height: cell }}>
          {Array.from({ length: modules }).map((__, c) => {
            const on = isFinder(r, c) ? finderOn(r, c) : cells[r * modules + c];
            return (
              <div
                key={c}
                className={on ? 'bg-black' : 'bg-white'}
                style={{ width: cell, height: cell }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
