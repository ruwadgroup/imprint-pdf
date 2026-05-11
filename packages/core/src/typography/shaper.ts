import {
  Direction,
  Blob as HbBlob,
  Buffer as HbBuffer,
  Face as HbFace,
  Font as HbFont2,
  shape,
} from 'harfbuzzjs';
import { type ScriptTag, splitByScript } from './script.js';

export interface HbFont {
  font: HbFont2;
  upem: number;
}

export function createHbFont(fontBytes: Uint8Array): HbFont {
  // `Uint8Array` can be a partial view into a larger ArrayBuffer (Node's
  // Buffer pool, sub-allocations, etc.). HarfBuzz parses every byte of the
  // ArrayBuffer it's handed and throws `RangeError: Index out of range` when
  // it walks past the font's actual end. Hand it just the font's slice.
  const isTight =
    fontBytes.byteOffset === 0 && fontBytes.byteLength === fontBytes.buffer.byteLength;
  const ab = isTight
    ? (fontBytes.buffer as ArrayBuffer)
    : (fontBytes.slice().buffer as ArrayBuffer);
  const blob = new HbBlob(ab);
  const face = new HbFace(blob);
  const font = new HbFont2(face);
  font.setScale(face.upem, face.upem);
  return { font, upem: face.upem };
}

export interface ShapeOptions {
  variations?: Record<string, number>;
  language?: string;
  /** Enables vertical metrics (`vert` / `vrt2` GSUB) and uses `yAdvance`. */
  vertical?: boolean;
}

const RTL_SCRIPTS = new Set<ScriptTag>(['arab', 'hebr']);

function shapeRun(hbFont: HbFont, text: string, script: ScriptTag, options: ShapeOptions): number {
  const buf = new HbBuffer();
  buf.addText(text);
  buf.setScript(script);
  buf.setDirection(
    options.vertical ? Direction.TTB : RTL_SCRIPTS.has(script) ? Direction.RTL : Direction.LTR,
  );
  if (options.language) buf.setLanguage(options.language);
  shape(hbFont.font, buf);
  let total = 0;
  for (const p of buf.getGlyphPositions()) {
    total += options.vertical ? -p.yAdvance : p.xAdvance;
  }
  return total;
}

/**
 * Shapes `text` and returns its total advance in points. Splits into per-script
 * runs first — HarfBuzz's `guessSegmentProperties` only reads the first strong
 * character, which mis-shapes mixed-script text.
 */
export function shapeAdvance(
  hbFont: HbFont,
  text: string,
  sizePt: number,
  options: ShapeOptions = {},
): number {
  if (options.variations && Object.keys(options.variations).length > 0) {
    hbFont.font.setVariations(options.variations);
  }

  const runs = splitByScript(text);
  if (runs.length === 0) return 0;
  let total = 0;
  for (const run of runs) total += shapeRun(hbFont, run.text, run.script, options);
  return (total / hbFont.upem) * sizePt;
}
