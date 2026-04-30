export function pdfY(pageHeight: number, layoutY: number, elemHeight: number): number {
  return pageHeight - layoutY - elemHeight;
}

export function alignTextX(
  align: string,
  startX: number,
  containerWidth: number,
  lineWidth: number,
): number {
  if (align === 'right') return startX + Math.max(0, containerWidth - lineWidth);
  if (align === 'center') return startX + Math.max(0, (containerWidth - lineWidth) / 2);
  return startX;
}
