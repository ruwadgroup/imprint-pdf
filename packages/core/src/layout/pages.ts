import type { PageDefaults, PageNode, PageSize, SizeUnit } from '../types.js';
import { PAGE_SIZES, UNIT_TO_PT } from './units.js';

export function resolvePageDimensions(node: PageNode, defaults?: PageDefaults): [number, number] {
  const props = node.props;
  const sizeRaw: PageSize = (props.size as PageSize | undefined) ?? defaults?.size ?? 'A4';
  const unit: SizeUnit = (props.sizeUnit as SizeUnit | undefined) ?? defaults?.sizeUnit ?? 'pt';
  const orientation = props.orientation ?? defaults?.orientation ?? 'portrait';
  let w: number, h: number;
  if (Array.isArray(sizeRaw)) {
    const factor = UNIT_TO_PT[unit as keyof typeof UNIT_TO_PT] ?? 1;
    w = sizeRaw[0] * factor;
    h = sizeRaw[1] * factor;
  } else {
    const dims = PAGE_SIZES[sizeRaw];
    w = dims[0];
    h = dims[1];
  }
  if (orientation === 'landscape' && w < h) return [h, w];
  return [w, h];
}
