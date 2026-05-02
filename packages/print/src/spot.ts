import type { PDFDocument, PDFRef } from 'pdf-lib';
import { PDFArray, PDFDict, PDFName, PDFNumber } from 'pdf-lib';
import type { CmykColor } from './cmyk.js';

/** Spot (Separation) colour with a CMYK fallback used for screen preview. */
export interface SpotColor {
  /** Colour name as it should appear in the `/Separation` array, e.g. `PANTONE 485 C`. */
  name: string;
  /** CMYK tint approximation. Required by ISO 32000-2 §8.6.6.4. */
  alternate: CmykColor;
  /** Tint percentage, 0–100; defaults to 100 (full ink). */
  tint?: number;
}

/** Convenience constructor; mirrors `defineConfig`-style ergonomics. */
export function defineSpotColor(name: string, alternate: CmykColor, tint = 100): SpotColor {
  return { name, alternate, tint };
}

/**
 * Embeds a Separation colour space referencing a CMYK alternate transform.
 *
 * Returns the `[/Separation /<name> /DeviceCMYK <tint-fn>]` array as a
 * registered indirect object that callers can drop into a page's
 * `/Resources/ColorSpace` dictionary.
 *
 * The tint transform is a Type-2 (axial) function that maps `t ∈ [0, 1]`
 * (the tint passed via the `sc`/`scn` operator) to the alternate CMYK
 * channels — a linear ramp from white (`0 0 0 0`) to the spot's CMYK at
 * full tint.
 */
export function embedSpotColorSpace(doc: PDFDocument, spot: SpotColor): PDFRef {
  const c = spot.alternate.c / 100;
  const m = spot.alternate.m / 100;
  const y = spot.alternate.y / 100;
  const k = spot.alternate.k / 100;

  const tintFunction = doc.context.obj({
    FunctionType: 2,
    Domain: [0, 1],
    Range: [0, 1, 0, 1, 0, 1, 0, 1],
    C0: [0, 0, 0, 0],
    C1: [c, m, y, k],
    N: 1,
  });
  const tintRef = doc.context.register(tintFunction);

  const colorSpace = PDFArray.withContext(doc.context);
  colorSpace.push(PDFName.of('Separation'));
  colorSpace.push(PDFName.of(escapeColorName(spot.name)));
  colorSpace.push(PDFName.of('DeviceCMYK'));
  colorSpace.push(tintRef);
  return doc.context.register(colorSpace);
}

/**
 * Emits a graphics-state dict that turns on PDF overprint (stroke + fill).
 * Add the returned ref to a page `/Resources/ExtGState` dict and reference
 * with `/<name> gs` in the content stream.
 */
export function embedOverprintState(doc: PDFDocument, opm: 0 | 1 = 1): PDFRef {
  const dict = PDFDict.withContext(doc.context);
  dict.set(PDFName.of('Type'), PDFName.of('ExtGState'));
  dict.set(PDFName.of('OP'), doc.context.obj(true));
  dict.set(PDFName.of('op'), doc.context.obj(true));
  dict.set(PDFName.of('OPM'), PDFNumber.of(opm));
  return doc.context.register(dict);
}

/**
 * PDF names use a restrictive character set; `#` plus 2-hex escape any byte
 * that isn't allowed. PANTONE / HKS names with spaces or "®" survive the
 * round-trip this way.
 */
function escapeColorName(name: string): string {
  let out = '';
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i);
    if (c >= 33 && c <= 126 && c !== 0x23 && c !== 0x28 && c !== 0x29 && c !== 0x2f) {
      out += name[i];
    } else {
      out += `#${c.toString(16).padStart(2, '0').toUpperCase()}`;
    }
  }
  return out;
}
