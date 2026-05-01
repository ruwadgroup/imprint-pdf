import type {
  Dimension,
  GridPlacement,
  GridTemplateComponent,
  LengthPercentage,
  LengthPercentageAuto,
  Line,
  MaxTrackSizingFunction,
  MinTrackSizingFunction,
  Size,
  TrackSizingFunction,
} from 'taffy-wasm';
import taffyInit, {
  AlignContent,
  AlignItems,
  AlignSelf,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  Position,
  Style,
  TaffyTree,
} from 'taffy-wasm';
import type { ComputedGeometry, PdfNode, ResolvedStyle, TextNode } from '../types.js';
import type { LoadedFont } from '../typography/fonts.js';
import { selectFont } from '../typography/fonts.js';
import { measureText } from '../typography/text.js';
import { resolveEdges } from './edges.js';
import { resolvePageDimensions } from './pages.js';
import { resolvePt } from './units.js';

async function loadTaffy(): Promise<void> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const { readFile } = await import('node:fs/promises');
    const { createRequire } = await import('node:module');
    const req = createRequire(import.meta.url);
    const wasmPath: string = req.resolve('taffy-wasm/taffy_wasm_bg.wasm');
    const bytes = await readFile(wasmPath);
    await taffyInit(bytes);
  } else {
    await taffyInit();
  }
}

const taffyReady: Promise<void> = loadTaffy();

function dim(
  v: string | number | undefined,
  containerWidth: number,
  fallback: Dimension = 'auto',
): Dimension {
  if (v === undefined || v === 'auto' || v === '') return fallback;
  if (typeof v === 'string' && v.endsWith('%')) return v as `${number}%`;
  return resolvePt(v, containerWidth);
}

function dimBounded(v: string | number | undefined, containerWidth: number): Dimension {
  if (v === undefined || v === 'none') return 'auto';
  return dim(v, containerWidth);
}

function lp(v: number | undefined): LengthPercentage {
  return v ?? 0;
}

function lpa(v: number | string | undefined): LengthPercentageAuto {
  if (v === undefined) return 0;
  if (v === 'auto') return 'auto';
  return typeof v === 'number' ? v : parseFloat(String(v)) || 0;
}

function parseGridPlacement(v: string | number | undefined): GridPlacement {
  if (v === undefined || v === 'auto') return 'auto';
  if (typeof v === 'number') return v;
  const s = v.trim();
  if (s === 'auto') return 'auto';
  const span = /^span\s+(\d+)$/.exec(s);
  if (span) return { span: parseInt(span[1] ?? '0', 10) };
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 'auto' : n;
}

function parseGridLine(
  shorthand: string | undefined,
  startField: string | number | undefined,
  endField: string | number | undefined,
): Line<GridPlacement> {
  if (shorthand !== undefined) {
    const [a, b] = shorthand.split('/').map((p) => p.trim());
    return { start: parseGridPlacement(a), end: parseGridPlacement(b) };
  }
  return { start: parseGridPlacement(startField), end: parseGridPlacement(endField) };
}

function parseTrackToken(token: string): TrackSizingFunction {
  if (token.endsWith('fr')) {
    const max = token as MaxTrackSizingFunction;
    return { min: 'auto' as MinTrackSizingFunction, max };
  }
  if (token === 'auto') return { min: 'auto', max: 'auto' };
  if (token === 'min-content') return { min: 'min-content', max: 'min-content' };
  if (token === 'max-content') return { min: 'max-content', max: 'max-content' };
  const px = parseFloat(token);
  if (!Number.isNaN(px)) return { min: px, max: px };
  return { min: 'auto', max: 'auto' };
}

function parseGridTemplate(template: string | undefined): GridTemplateComponent[] {
  if (!template) return [];
  const tokens = template.trim().split(/\s+/);
  const result: GridTemplateComponent[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token) {
      i++;
      continue;
    }
    const repeatMatch = /^repeat\((\d+|auto-fill|auto-fit),?$/.exec(token);
    if (repeatMatch) {
      const countStr = repeatMatch[1] ?? '';
      const count =
        countStr === 'auto-fill'
          ? 'auto-fill'
          : countStr === 'auto-fit'
            ? 'auto-fit'
            : parseInt(countStr, 10);
      const tracks: TrackSizingFunction[] = [];
      i++;
      while (i < tokens.length && !tokens[i]?.endsWith(')')) {
        const t = tokens[i]?.replace(/[,)]/g, '') ?? '';
        if (t) tracks.push(parseTrackToken(t));
        i++;
      }
      if (i < tokens.length) {
        const last = tokens[i]?.replace(/[,)]/g, '') ?? '';
        if (last) tracks.push(parseTrackToken(last));
      }
      result.push({ count, tracks });
    } else {
      result.push(parseTrackToken(token.replace(/[,)]/g, '')));
    }
    i++;
  }
  return result;
}

function toTaffyStyle(style: ResolvedStyle, containerWidth: number): Style {
  const s = new Style();

  const display = style.display ?? 'block';
  const isFlex = display === 'flex' || display === 'inline-flex';
  if (display === 'grid') s.display = Display.Grid;
  else if (display === 'none') s.display = Display.None;
  // Taffy's Block doesn't propagate available width into leaf measure callbacks;
  // emulate it via flex-column + alignItems:Stretch (Yoga uses the same trick).
  else s.display = Display.Flex;

  const pos = style.position ?? 'static';
  s.position = pos === 'absolute' ? Position.Absolute : Position.Relative;

  const flexDir = isFlex ? (style.flexDirection ?? 'row') : 'column';
  if (flexDir === 'column') s.flexDirection = FlexDirection.Column;
  else if (flexDir === 'row-reverse') s.flexDirection = FlexDirection.RowReverse;
  else if (flexDir === 'column-reverse') s.flexDirection = FlexDirection.ColumnReverse;
  else s.flexDirection = FlexDirection.Row;

  const wrap = style.flexWrap ?? 'nowrap';
  if (wrap === 'wrap') s.flexWrap = FlexWrap.Wrap;
  else if (wrap === 'wrap-reverse') s.flexWrap = FlexWrap.WrapReverse;
  else s.flexWrap = FlexWrap.NoWrap;

  const ai = style.alignItems;
  if (ai === 'flex-start' || ai === 'start') s.alignItems = AlignItems.FlexStart;
  else if (ai === 'flex-end' || ai === 'end') s.alignItems = AlignItems.FlexEnd;
  else if (ai === 'center') s.alignItems = AlignItems.Center;
  else if (ai === 'baseline') s.alignItems = AlignItems.Baseline;
  else s.alignItems = AlignItems.Stretch;

  const ac = style.alignContent;
  if (ac === 'flex-start' || ac === 'start') s.alignContent = AlignContent.FlexStart;
  else if (ac === 'flex-end' || ac === 'end') s.alignContent = AlignContent.FlexEnd;
  else if (ac === 'center') s.alignContent = AlignContent.Center;
  else if (ac === 'space-between') s.alignContent = AlignContent.SpaceBetween;
  else if (ac === 'space-around') s.alignContent = AlignContent.SpaceAround;
  else if (ac === 'space-evenly') s.alignContent = AlignContent.SpaceEvenly;
  else s.alignContent = AlignContent.Stretch;

  const as_ = style.alignSelf;
  if (as_ === 'flex-start' || as_ === 'start') s.alignSelf = AlignSelf.FlexStart;
  else if (as_ === 'flex-end' || as_ === 'end') s.alignSelf = AlignSelf.FlexEnd;
  else if (as_ === 'center') s.alignSelf = AlignSelf.Center;
  else if (as_ === 'baseline') s.alignSelf = AlignSelf.Baseline;
  else if (as_ === 'stretch') s.alignSelf = AlignSelf.Stretch;

  const jc = style.justifyContent;
  if (jc === 'flex-end' || jc === 'end') s.justifyContent = JustifyContent.FlexEnd;
  else if (jc === 'center') s.justifyContent = JustifyContent.Center;
  else if (jc === 'space-between') s.justifyContent = JustifyContent.SpaceBetween;
  else if (jc === 'space-around') s.justifyContent = JustifyContent.SpaceAround;
  else if (jc === 'space-evenly') s.justifyContent = JustifyContent.SpaceEvenly;
  else s.justifyContent = JustifyContent.FlexStart;

  // `flex: 1` expands to `1 1 0%`; preserve the 0 basis when no longhand
  // flex-basis follows, so `flex-1` columns share width equally.
  let basisSetByShorthand = false;
  if (style.flex !== undefined) {
    const f = typeof style.flex === 'number' ? style.flex : parseFloat(String(style.flex));
    if (!Number.isNaN(f)) {
      s.flexGrow = f;
      s.flexShrink = 1;
      s.flexBasis = 0;
      basisSetByShorthand = true;
    }
  }
  if (style.flexGrow !== undefined) {
    const v =
      typeof style.flexGrow === 'number' ? style.flexGrow : parseFloat(String(style.flexGrow));
    if (!Number.isNaN(v)) s.flexGrow = v;
  }
  if (style.flexShrink !== undefined) {
    const v =
      typeof style.flexShrink === 'number'
        ? style.flexShrink
        : parseFloat(String(style.flexShrink));
    if (!Number.isNaN(v)) s.flexShrink = v;
  }
  if (style.flexBasis !== undefined) {
    s.flexBasis = style.flexBasis === 'auto' ? 'auto' : resolvePt(style.flexBasis, containerWidth);
  } else if (!basisSetByShorthand) {
    s.flexBasis = 'auto';
  }

  s.size = {
    width: dim(style.width, containerWidth),
    height: dim(style.height, containerWidth),
  };
  s.minSize = {
    width: dim(style.minWidth, containerWidth, 0),
    height: dim(style.minHeight, containerWidth, 0),
  };
  s.maxSize = {
    width: dimBounded(style.maxWidth, containerWidth),
    height: dimBounded(style.maxHeight, containerWidth),
  };

  const padding = resolveEdges(style, 'padding', containerWidth);
  s.padding = {
    top: lp(padding.top),
    right: lp(padding.right),
    bottom: lp(padding.bottom),
    left: lp(padding.left),
  };

  const margin = resolveEdges(style, 'margin', containerWidth);
  s.margin = {
    top: lpa(margin.top),
    right: lpa(margin.right),
    bottom: lpa(margin.bottom),
    left: lpa(margin.left),
  };

  const gapBase = style.gap !== undefined ? resolvePt(style.gap, containerWidth) : 0;
  const rowGap = style.rowGap !== undefined ? resolvePt(style.rowGap, containerWidth) : gapBase;
  const colGap =
    style.columnGap !== undefined ? resolvePt(style.columnGap, containerWidth) : gapBase;
  s.gap = { width: colGap, height: rowGap } satisfies Size<LengthPercentage>;

  if (pos === 'absolute') {
    s.inset = {
      top: style.top !== undefined ? resolvePt(style.top, containerWidth) : 'auto',
      right: style.right !== undefined ? resolvePt(style.right, containerWidth) : 'auto',
      bottom: style.bottom !== undefined ? resolvePt(style.bottom, containerWidth) : 'auto',
      left: style.left !== undefined ? resolvePt(style.left, containerWidth) : 'auto',
    };
  }

  if (style.gridTemplateColumns !== undefined) {
    s.gridTemplateColumns = parseGridTemplate(style.gridTemplateColumns);
  }
  if (style.gridTemplateRows !== undefined) {
    s.gridTemplateRows = parseGridTemplate(style.gridTemplateRows);
  }

  s.gridColumn = parseGridLine(
    style.gridColumn,
    style.gridColumnStart ??
      (style.gridColumnSpan !== undefined ? `span ${style.gridColumnSpan}` : undefined),
    style.gridColumnEnd,
  );
  s.gridRow = parseGridLine(style.gridRow, style.gridRowStart, style.gridRowEnd);

  if (style.aspectRatio !== undefined) {
    const ar = String(style.aspectRatio);
    if (ar.includes('/')) {
      const [num, den] = ar.split('/').map((v) => parseFloat(v.trim()));
      if (num && den && den !== 0) s.aspectRatio = num / den;
    } else {
      const n = parseFloat(ar);
      if (!Number.isNaN(n)) s.aspectRatio = n;
    }
  }

  return s;
}

interface LeafContext {
  node: PdfNode;
  fixed?: boolean;
  /** Carries an ancestor's font-family down so text measure agrees with draw. */
  inheritedFontFamily?: string;
}

interface BuildResult {
  taffyId: bigint;
  imprintId: string;
  children: BuildResult[];
}

function buildNode(
  node: PdfNode,
  tree: TaffyTree,
  containerWidth: number,
  inheritedFontFamily?: string,
): BuildResult {
  const isLeafFixed = node.type === 'image' || node.type === 'svg' || node.type === 'chart';

  const ownFamily = (node.style.fontFamily as string | undefined) ?? undefined;
  const passDownFamily = ownFamily ?? inheritedFontFamily;

  if (node.type === 'text') {
    const s = new Style();
    s.display = Display.Flex;
    const ctx: LeafContext = passDownFamily
      ? { node, inheritedFontFamily: passDownFamily }
      : { node };
    const taffyId = tree.newLeafWithContext(s, ctx);
    return { taffyId, imprintId: node.id, children: [] };
  }

  if (isLeafFixed) {
    const s = toTaffyStyle(node.style, containerWidth);
    const ctx: LeafContext = passDownFamily
      ? { node, fixed: true, inheritedFontFamily: passDownFamily }
      : { node, fixed: true };
    const taffyId = tree.newLeafWithContext(s, ctx);
    return { taffyId, imprintId: node.id, children: [] };
  }

  const s = toTaffyStyle(node.style, containerWidth);
  const childResults: BuildResult[] = [];
  const childTaffyIds: bigint[] = [];
  for (const child of node.children) {
    const r = buildNode(child, tree, containerWidth, passDownFamily);
    childResults.push(r);
    childTaffyIds.push(r.taffyId);
  }
  const taffyId = tree.newWithChildren(s, BigUint64Array.from(childTaffyIds));
  return { taffyId, imprintId: node.id, children: childResults };
}

function extractGeometries(
  result: BuildResult,
  tree: TaffyTree,
  parentAbsX: number,
  parentAbsY: number,
  geometries: Map<string, ComputedGeometry>,
): void {
  const layout = tree.getLayout(result.taffyId);
  const absX = parentAbsX + layout.x;
  const absY = parentAbsY + layout.y;

  geometries.set(result.imprintId, {
    x: absX,
    y: absY,
    width: layout.width,
    height: layout.height,
    paddingTop: layout.paddingTop,
    paddingRight: layout.paddingRight,
    paddingBottom: layout.paddingBottom,
    paddingLeft: layout.paddingLeft,
    contentWidth: layout.contentWidth,
    contentHeight: layout.contentHeight,
  });

  // Taffy already folds parent padding into child layout.x/y.
  for (const child of result.children) {
    extractGeometries(child, tree, absX, absY, geometries);
  }
}

function makePageGeo(w: number, h: number): ComputedGeometry {
  return {
    x: 0,
    y: 0,
    width: w,
    height: h,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    contentWidth: w,
    contentHeight: h,
  };
}

async function layoutPage(
  pageNode: PdfNode,
  pageW: number,
  pageH: number,
  geometries: Map<string, ComputedGeometry>,
  fontMetrics: Map<string, LoadedFont> = new Map(),
): Promise<void> {
  const tree = new TaffyTree();
  // PDF measures in fractional points; Taffy's pixel rounding would cause
  // line-breaker disagreement between layout and draw.
  tree.disableRounding();

  const rootStyle = toTaffyStyle(pageNode.style, pageW);
  rootStyle.size = { width: pageW, height: pageH };
  rootStyle.position = Position.Relative;

  const padding = resolveEdges(pageNode.style, 'padding', pageW);
  const contentW = pageW - padding.left - padding.right;

  const pageFontFamily = pageNode.style.fontFamily as string | undefined;
  const childResults: BuildResult[] = [];
  const childTaffyIds: bigint[] = [];
  for (const child of pageNode.children) {
    const r = buildNode(child, tree, contentW, pageFontFamily);
    childResults.push(r);
    childTaffyIds.push(r.taffyId);
  }
  const rootId = tree.newWithChildren(rootStyle, BigUint64Array.from(childTaffyIds));
  const rootResult: BuildResult = {
    taffyId: rootId,
    imprintId: pageNode.id,
    children: childResults,
  };

  tree.computeLayoutWithMeasure(
    rootId,
    { width: pageW, height: pageH },
    (knownDimensions, availableSpace, _node, context, _style) => {
      const ctx = context as LeafContext | undefined;
      if (!ctx) return { width: 0, height: 0 };
      const { node, fixed } = ctx;
      const availW = typeof availableSpace.width === 'number' ? availableSpace.width : pageW;

      if (fixed) {
        if (node.type === 'chart') {
          const props = node.props as { width?: number; height?: number };
          return {
            width: knownDimensions.width ?? props.width ?? resolvePt(node.style.width, availW),
            height: knownDimensions.height ?? props.height ?? resolvePt(node.style.height, pageH),
          };
        }
        return {
          width: knownDimensions.width ?? resolvePt(node.style.width, availW),
          height: knownDimensions.height ?? resolvePt(node.style.height, pageH),
        };
      }

      if (node.type === 'text') {
        const textNode = node as TextNode;
        const effectiveWidth = knownDimensions.width ?? (availW > 0 ? availW : pageW);
        const style = textNode.style;
        const familyRaw =
          (style.fontFamily as string | undefined) ?? ctx.inheritedFontFamily ?? 'Helvetica';
        const family =
          familyRaw
            .split(',')[0]
            ?.trim()
            .replace(/^['"]|['"]$/g, '') ?? 'Helvetica';
        const weight =
          style.fontWeight !== undefined ? parseInt(String(style.fontWeight), 10) : 400;
        const fontStyle: 'normal' | 'italic' =
          (style.fontStyle as 'normal' | 'italic' | undefined) ?? 'normal';
        const font = selectFont(fontMetrics, family, weight, fontStyle);
        const metrics = measureText(textNode.text, style, effectiveWidth, font);
        return {
          width: knownDimensions.width ?? metrics.width,
          height: knownDimensions.height ?? metrics.height,
        };
      }

      return { width: knownDimensions.width ?? 0, height: knownDimensions.height ?? 0 };
    },
  );

  geometries.set(pageNode.id, makePageGeo(pageW, pageH));

  for (const child of rootResult.children) {
    extractGeometries(child, tree, 0, 0, geometries);
  }

  tree.free();
}

export async function runTaffyLayout(
  node: PdfNode,
  containerWidth: number,
  containerHeight: number,
  fontMetrics: Map<string, LoadedFont> = new Map(),
): Promise<Map<string, ComputedGeometry>> {
  await taffyReady;

  const geometries = new Map<string, ComputedGeometry>();

  if (node.type === 'document') {
    geometries.set(node.id, makePageGeo(containerWidth, containerHeight));
    const pageDefaults = node.props.pageDefaults as import('../types.js').PageDefaults | undefined;
    for (const child of node.children) {
      if (child.type === 'page') {
        const [pageW, pageH] = resolvePageDimensions(child, pageDefaults);
        await layoutPage(child, pageW, pageH, geometries, fontMetrics);
      } else {
        await layoutPage(child, containerWidth, containerHeight, geometries, fontMetrics);
      }
    }
  } else if (node.type === 'page') {
    const [pageW, pageH] = resolvePageDimensions(node);
    await layoutPage(node, pageW, pageH, geometries, fontMetrics);
  } else {
    await layoutPage(node, containerWidth, containerHeight, geometries, fontMetrics);
  }

  return geometries;
}
