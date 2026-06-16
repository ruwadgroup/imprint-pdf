import { type ScriptTag, splitByScript } from './script.js';

export interface HbFont {
  upem: number;
  shapeAdvance(text: string, sizePt: number, options?: ShapeOptions): number;
}

function importRuntime<T>(specifier: string): Promise<T> {
  return import(specifier) as Promise<T>;
}

export async function createHbFont(fontBytes: Uint8Array): Promise<HbFont> {
  const hb = await importRuntime<typeof import('harfbuzzjs')>('harfbuzzjs');
  // A `Uint8Array` can be a partial view into a larger ArrayBuffer (Node's
  // Buffer pool, sub-allocations, ...). HarfBuzz reads every byte of the
  // ArrayBuffer and throws `RangeError: Index out of range` once it walks
  // past the font. Hand it a tight slice.
  const isTight =
    fontBytes.byteOffset === 0 && fontBytes.byteLength === fontBytes.buffer.byteLength;
  const ab = isTight
    ? (fontBytes.buffer as ArrayBuffer)
    : (fontBytes.slice().buffer as ArrayBuffer);
  const blob = new hb.Blob(ab);
  const face = new hb.Face(blob);
  const font = new hb.Font(face);
  font.setScale(face.upem, face.upem);
  const upem = face.upem;
  return {
    upem,
    shapeAdvance(text: string, sizePt: number, options: ShapeOptions = {}) {
      return shapeAdvance(hb, font, upem, text, sizePt, options);
    },
  };
}

export interface ShapeOptions {
  variations?: Record<string, number>;
  language?: string;
  /** Enables vertical metrics (`vert` / `vrt2` GSUB) and uses `yAdvance`. */
  vertical?: boolean;
}

const RTL_SCRIPTS = new Set<ScriptTag>(['arab', 'hebr']);

type HarfbuzzModule = typeof import('harfbuzzjs');
type HarfbuzzFont = InstanceType<HarfbuzzModule['Font']>;

function shapeRun(
  hb: HarfbuzzModule,
  font: HarfbuzzFont,
  text: string,
  script: ScriptTag,
  options: ShapeOptions,
): number {
  const buf = new hb.Buffer();
  buf.addText(text);
  buf.setScript(script);
  buf.setDirection(
    options.vertical
      ? hb.Direction.TTB
      : RTL_SCRIPTS.has(script)
        ? hb.Direction.RTL
        : hb.Direction.LTR,
  );
  if (options.language) buf.setLanguage(options.language);
  hb.shape(font, buf);
  let total = 0;
  for (const p of buf.getGlyphPositions()) {
    total += options.vertical ? -p.yAdvance : p.xAdvance;
  }
  return total;
}

// Shapes `text` and returns its total advance in points. Splits into per-script
// runs first — HarfBuzz's `guessSegmentProperties` only reads the first strong
// character, which mis-shapes mixed-script text.
function shapeAdvance(
  hb: HarfbuzzModule,
  font: HarfbuzzFont,
  upem: number,
  text: string,
  sizePt: number,
  options: ShapeOptions = {},
): number {
  if (options.variations && Object.keys(options.variations).length > 0) {
    font.setVariations(
      Object.entries(options.variations).map(([axis, value]) => new hb.Variation(axis, value)),
    );
  }

  const runs = splitByScript(text);
  if (runs.length === 0) return 0;
  let total = 0;
  for (const run of runs) total += shapeRun(hb, font, run.text, run.script, options);
  return (total / upem) * sizePt;
}
