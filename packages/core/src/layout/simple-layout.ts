import type { ComputedGeometry, PdfNode, ResolvedStyle, TextNode } from '../types.js';
import type { LoadedFont } from '../typography/font-common.js';
import { selectFont } from '../typography/font-common.js';
import { measureText } from '../typography/text.js';
import { resolvePageDimensions } from './pages.js';
import { resolvePt } from './units.js';

const ZERO_GEO = {
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  contentWidth: 0,
  contentHeight: 0,
};

function pt(value: string | number | undefined, base: number, fallback = 0): number {
  if (value === undefined || value === 'auto' || value === '') return fallback;
  return resolvePt(value, base);
}

function edge(style: ResolvedStyle, side: 'Top' | 'Right' | 'Bottom' | 'Left', base: number) {
  const specific = style[`padding${side}` as keyof ResolvedStyle] as string | number | undefined;
  return pt(specific ?? style.padding, base);
}

function margin(style: ResolvedStyle, side: 'Top' | 'Right' | 'Bottom' | 'Left', base: number) {
  const specific = style[`margin${side}` as keyof ResolvedStyle] as string | number | undefined;
  return pt(specific ?? style.margin, base);
}

function gridColumnCount(style: ResolvedStyle): number {
  const template = style.gridTemplateColumns;
  if (!template) return 1;
  const repeat = /repeat\(\s*(\d+)/.exec(template);
  if (repeat?.[1]) return Math.max(1, parseInt(repeat[1], 10));
  return Math.max(1, template.trim().split(/\s+/).length);
}

function fontWeight(style: ResolvedStyle): number {
  const raw = style.fontWeight;
  if (typeof raw === 'number') return raw;
  if (raw === 'bold') return 700;
  if (raw === undefined || raw === 'normal') return 400;
  const parsed = parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : 400;
}

function textHeight(
  node: TextNode,
  width: number,
  style: ResolvedStyle,
  fontMetrics: Map<string, LoadedFont>,
): number {
  const family = typeof style.fontFamily === 'string' ? style.fontFamily : 'Helvetica';
  const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal';
  const font = selectFont(fontMetrics, family, fontWeight(style), fontStyle);
  return measureText(node.text ?? '', style, width, font).height;
}

function baseGeometry(
  node: PdfNode,
  x: number,
  y: number,
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
): ComputedGeometry {
  return {
    x,
    y,
    width,
    height,
    paddingTop: padding.top,
    paddingRight: padding.right,
    paddingBottom: padding.bottom,
    paddingLeft: padding.left,
    contentWidth: Math.max(0, width - padding.left - padding.right),
    contentHeight: Math.max(0, height - padding.top - padding.bottom),
    ...(typeof node.style.fontFamily === 'string' ? { fontFamily: node.style.fontFamily } : {}),
  };
}

function layoutNode(
  node: PdfNode,
  x: number,
  y: number,
  width: number,
  geometries: Map<string, ComputedGeometry>,
  fontMetrics: Map<string, LoadedFont>,
): number {
  const style = node.style;
  const mt = margin(style, 'Top', width);
  const mr = margin(style, 'Right', width);
  const mb = margin(style, 'Bottom', width);
  const ml = margin(style, 'Left', width);
  const ownX = x + ml;
  const ownY = y + mt;
  const ownWidth = pt(style.width, width, Math.max(0, width - ml - mr));
  const padding = {
    top: edge(style, 'Top', ownWidth),
    right: edge(style, 'Right', ownWidth),
    bottom: edge(style, 'Bottom', ownWidth),
    left: edge(style, 'Left', ownWidth),
  };
  const contentX = ownX + padding.left;
  const contentY = ownY + padding.top;
  const contentWidth = Math.max(0, ownWidth - padding.left - padding.right);

  let contentHeight = 0;
  if (node.type === 'text') {
    contentHeight = textHeight(node as TextNode, contentWidth || ownWidth, style, fontMetrics);
  } else if (node.children.length > 0) {
    const isGrid = style.display === 'grid' || style.gridTemplateColumns !== undefined;
    if (isGrid) {
      const columns = gridColumnCount(style);
      const gap = pt(style.gap, contentWidth);
      const columnWidth = Math.max(0, (contentWidth - gap * (columns - 1)) / columns);
      let rowY = contentY;
      for (let i = 0; i < node.children.length; i += columns) {
        let rowHeight = 0;
        for (let col = 0; col < columns; col++) {
          const child = node.children[i + col];
          if (!child) continue;
          const childHeight = layoutNode(
            child,
            contentX + col * (columnWidth + gap),
            rowY,
            columnWidth,
            geometries,
            fontMetrics,
          );
          rowHeight = Math.max(rowHeight, childHeight);
        }
        rowY += rowHeight + gap;
        contentHeight += rowHeight + (i + columns < node.children.length ? gap : 0);
      }
    } else {
      let childY = contentY;
      for (const child of node.children) {
        const childHeight = layoutNode(
          child,
          contentX,
          childY,
          contentWidth,
          geometries,
          fontMetrics,
        );
        childY += childHeight;
        contentHeight += childHeight;
      }
    }
  }

  const explicitHeight = pt(style.height, width, NaN);
  const ownHeight = Number.isFinite(explicitHeight)
    ? explicitHeight
    : padding.top + contentHeight + padding.bottom;
  geometries.set(node.id, baseGeometry(node, ownX, ownY, ownWidth, ownHeight, padding));
  return mt + ownHeight + mb;
}

function layoutPage(
  page: PdfNode,
  pageWidth: number,
  pageHeight: number,
  geometries: Map<string, ComputedGeometry>,
  fontMetrics: Map<string, LoadedFont>,
) {
  const padding = {
    top: edge(page.style, 'Top', pageWidth),
    right: edge(page.style, 'Right', pageWidth),
    bottom: edge(page.style, 'Bottom', pageWidth),
    left: edge(page.style, 'Left', pageWidth),
  };
  geometries.set(page.id, baseGeometry(page, 0, 0, pageWidth, pageHeight, padding));
  let y = padding.top;
  const contentWidth = Math.max(0, pageWidth - padding.left - padding.right);
  for (const child of page.children) {
    y += layoutNode(child, padding.left, y, contentWidth, geometries, fontMetrics);
  }
}

export async function runSimpleLayout(
  node: PdfNode,
  containerWidth: number,
  containerHeight: number,
  fontMetrics: Map<string, LoadedFont> = new Map(),
): Promise<Map<string, ComputedGeometry>> {
  const geometries = new Map<string, ComputedGeometry>();
  if (node.type === 'document') {
    geometries.set(node.id, {
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight,
      ...ZERO_GEO,
    });
    const pageDefaults = node.props.pageDefaults as import('../types.js').PageDefaults | undefined;
    for (const child of node.children) {
      if (child.type === 'page') {
        const [pageWidth, pageHeight] = resolvePageDimensions(child, pageDefaults);
        layoutPage(child, pageWidth, pageHeight, geometries, fontMetrics);
      } else {
        layoutPage(child, containerWidth, containerHeight, geometries, fontMetrics);
      }
    }
  } else if (node.type === 'page') {
    const [pageWidth, pageHeight] = resolvePageDimensions(node);
    layoutPage(node, pageWidth, pageHeight, geometries, fontMetrics);
  } else {
    layoutNode(node, 0, 0, containerWidth, geometries, fontMetrics);
  }
  return geometries;
}
