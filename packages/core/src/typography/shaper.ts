import {
  Blob as HbBlob,
  Buffer as HbBuffer,
  Face as HbFace,
  Font as HbFont2,
  shape,
} from 'harfbuzzjs';

export interface HbFont {
  font: HbFont2;
  upem: number;
}

export function createHbFont(fontBytes: Uint8Array): HbFont {
  const blob = new HbBlob(fontBytes.buffer as ArrayBuffer);
  const face = new HbFace(blob);
  const font = new HbFont2(face);
  // Shape in font design units; the caller scales advances to point size.
  font.setScale(face.upem, face.upem);
  return { font, upem: face.upem };
}

// Total advance width of `text` at `sizePt`, with HarfBuzz applying GSUB/GPOS
// (kerning, ligatures, marks). guessSegmentProperties picks script/direction
// from the buffer contents — good enough for measurement, where we don't care
// about the resolved glyph order.
export function shapeAdvance(hbFont: HbFont, text: string, sizePt: number): number {
  const buf = new HbBuffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  shape(hbFont.font, buf);
  let total = 0;
  for (const p of buf.getGlyphPositions()) total += p.xAdvance;
  return (total / hbFont.upem) * sizePt;
}
