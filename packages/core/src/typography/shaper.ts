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
  font.setScale(face.upem, face.upem);
  return { font, upem: face.upem };
}

export function shapeAdvance(hbFont: HbFont, text: string, sizePt: number): number {
  const buf = new HbBuffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  shape(hbFont.font, buf);
  let total = 0;
  for (const p of buf.getGlyphPositions()) total += p.xAdvance;
  return (total / hbFont.upem) * sizePt;
}
