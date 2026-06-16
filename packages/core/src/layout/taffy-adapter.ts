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
  Style,
  TaffyTree,
  TrackSizingFunction,
} from 'taffy-wasm';
import type { ComputedGeometry, PdfNode, ResolvedStyle, TextNode } from '../types.js';
import type { LoadedFont } from '../typography/fonts.js';
import { selectFont } from '../typography/fonts.js';
import { measureText } from '../typography/text.js';
import { resolveEdges } from './edges.js';
import { resolvePageDimensions } from './pages.js';
import { resolvePt } from './units.js';

type TaffyModule = typeof import('taffy-wasm');

let taffyModule: TaffyModule | undefined;

function getTaffy(): TaffyModule {
  if (!taffyModule) throw new Error('[imprint] Taffy layout engine has not initialized.');
  return taffyModule;
}

function importRuntime<T>(specifier: string): Promise<T> {
  return import(specifier) as Promise<T>;
}

async function loadTaffy(): Promise<void> {
  const mod = await importRuntime<TaffyModule>('taffy-wasm');
  taffyModule = mod;
  if (typeof process !== 'undefined' && process.versions?.node) {
    const nodeBuiltin = (name: string) => `node:${name}`;
    const { readFile } = (await import(
      nodeBuiltin('fs/promises')
    )) as typeof import('node:fs/promises');
    const { createRequire } = (await import(nodeBuiltin('module'))) as typeof import('node:module');
    const req = createRequire(import.meta.url);
    const wasmPath: string = req.resolve('taffy-wasm/taffy_wasm_bg.wasm');
    const bytes = await readFile(wasmPath);
    await mod.default(bytes);
  } else {
    await mod.default();
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

function toFloat(v: number | string): number {
  return typeof v === 'number' ? v : parseFloat(String(v));
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
      const count: number | 'auto-fill' | 'auto-fit' =
        countStr === 'auto-fill' || countStr === 'auto-fit' ? countStr : parseInt(countStr, 10);
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
  const taffy = getTaffy();
  const s = new taffy.Style();

  const display = style.display ?? 'block';
  const isFlex = display === 'flex' || display === 'inline-flex';
  if (display === 'grid') s.display = taffy.Display.Grid;
  else if (display === 'none') s.display = taffy.Display.None;
  // Taffy's Block doesn't propagate available width into leaf measure callbacks —
  // emulate it with flex-column + alignItems:Stretch (Yoga uses the same trick).
  else s.display = taffy.Display.Flex;

  const pos = style.position ?? 'static';
  s.position = pos === 'absolute' ? taffy.Position.Absolute : taffy.Position.Relative;

  const flexDir = isFlex ? (style.flexDirection ?? 'row') : 'column';
  if (flexDir === 'column') s.flexDirection = taffy.FlexDirection.Column;
  else if (flexDir === 'row-reverse') s.flexDirection = taffy.FlexDirection.RowReverse;
  else if (flexDir === 'column-reverse') s.flexDirection = taffy.FlexDirection.ColumnReverse;
  else s.flexDirection = taffy.FlexDirection.Row;

  const wrap = style.flexWrap ?? 'nowrap';
  if (wrap === 'wrap') s.flexWrap = taffy.FlexWrap.Wrap;
  else if (wrap === 'wrap-reverse') s.flexWrap = taffy.FlexWrap.WrapReverse;
  else s.flexWrap = taffy.FlexWrap.NoWrap;

  const aiMap = {
    'flex-start': taffy.AlignItems.FlexStart,
    start: taffy.AlignItems.FlexStart,
    'flex-end': taffy.AlignItems.FlexEnd,
    end: taffy.AlignItems.FlexEnd,
    center: taffy.AlignItems.Center,
    baseline: taffy.AlignItems.Baseline,
  };
  const acMap = {
    'flex-start': taffy.AlignContent.FlexStart,
    start: taffy.AlignContent.FlexStart,
    'flex-end': taffy.AlignContent.FlexEnd,
    end: taffy.AlignContent.FlexEnd,
    center: taffy.AlignContent.Center,
    'space-between': taffy.AlignContent.SpaceBetween,
    'space-around': taffy.AlignContent.SpaceAround,
    'space-evenly': taffy.AlignContent.SpaceEvenly,
  };
  const asMap = {
    'flex-start': taffy.AlignSelf.FlexStart,
    start: taffy.AlignSelf.FlexStart,
    'flex-end': taffy.AlignSelf.FlexEnd,
    end: taffy.AlignSelf.FlexEnd,
    center: taffy.AlignSelf.Center,
    baseline: taffy.AlignSelf.Baseline,
    stretch: taffy.AlignSelf.Stretch,
  };
  const jcMap = {
    'flex-end': taffy.JustifyContent.FlexEnd,
    end: taffy.JustifyContent.FlexEnd,
    center: taffy.JustifyContent.Center,
    'space-between': taffy.JustifyContent.SpaceBetween,
    'space-around': taffy.JustifyContent.SpaceAround,
    'space-evenly': taffy.JustifyContent.SpaceEvenly,
  };

  s.alignItems = aiMap[style.alignItems as keyof typeof aiMap] ?? taffy.AlignItems.Stretch;
  s.alignContent = acMap[style.alignContent as keyof typeof acMap] ?? taffy.AlignContent.Stretch;

  const asMapped = asMap[style.alignSelf as keyof typeof asMap];
  if (asMapped !== undefined) s.alignSelf = asMapped;

  s.justifyContent =
    jcMap[style.justifyContent as keyof typeof jcMap] ?? taffy.JustifyContent.FlexStart;

  // `flex: 1` expands to `1 1 0%` — keep the 0 basis when no longhand
  // flex-basis follows, so `flex-1` columns share width equally.
  let basisSetByShorthand = false;
  if (style.flex !== undefined) {
    const f = toFloat(style.flex);
    if (!Number.isNaN(f)) {
      s.flexGrow = f;
      s.flexShrink = 1;
      s.flexBasis = 0;
      basisSetByShorthand = true;
    }
  }
  if (style.flexGrow !== undefined) {
    const v = toFloat(style.flexGrow);
    if (!Number.isNaN(v)) s.flexGrow = v;
  }
  if (style.flexShrink !== undefined) {
    const v = toFloat(style.flexShrink);
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
  s.gap = {
    width: style.columnGap !== undefined ? resolvePt(style.columnGap, containerWidth) : gapBase,
    height: style.rowGap !== undefined ? resolvePt(style.rowGap, containerWidth) : gapBase,
  } satisfies Size<LengthPercentage>;

  if (pos === 'absolute') {
    const inset = (v: string | number | undefined): LengthPercentageAuto =>
      v !== undefined ? resolvePt(v, containerWidth) : 'auto';
    s.inset = {
      top: inset(style.top),
      right: inset(style.right),
      bottom: inset(style.bottom),
      left: inset(style.left),
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
      if (num && den) s.aspectRatio = num / den;
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
  // Cascaded typography from ancestors. The reconciler creates text nodes with
  // `style: {}` (parent's `<span className="text-[6.5pt]">` lives one level up),
  // so the measure callback has to read this cascade — otherwise every leaf
  // measures at the 12pt × 1.2 default and the drawn glyphs (which `drawNode`
  // cascades correctly) sit inside an oversized box, misaligning siblings.
  inheritedStyle?: ResolvedStyle;
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
  inheritedStyle?: ResolvedStyle,
): BuildResult {
  const isLeafFixed = node.type === 'image' || node.type === 'svg' || node.type === 'chart';

  // Typography cascades, geometry doesn't. measureText only reads typography
  // fields, so we merge the whole style and let unrelated keys fall through.
  const cascaded: ResolvedStyle = { ...(inheritedStyle ?? {}), ...node.style };

  if (node.type === 'text') {
    const taffy = getTaffy();
    const s = new taffy.Style();
    s.display = taffy.Display.Flex;
    const ctx: LeafContext = { node, inheritedStyle: cascaded };
    const taffyId = tree.newLeafWithContext(s, ctx);
    return { taffyId, imprintId: node.id, children: [] };
  }

  if (isLeafFixed) {
    const s = toTaffyStyle(node.style, containerWidth);
    const ctx: LeafContext = { node, fixed: true, inheritedStyle: cascaded };
    const taffyId = tree.newLeafWithContext(s, ctx);
    return { taffyId, imprintId: node.id, children: [] };
  }

  const s = toTaffyStyle(node.style, containerWidth);
  const childResults: BuildResult[] = [];
  const childTaffyIds: bigint[] = [];
  for (const child of node.children) {
    const r = buildNode(child, tree, containerWidth, cascaded);
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

  // Taffy already folds parent padding into child layout.x / y.
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
  const taffy = getTaffy();
  const tree = new taffy.TaffyTree();
  // PDF measures in fractional points — Taffy's pixel rounding would make
  // the line-breaker disagree between layout and draw.
  tree.disableRounding();

  const rootStyle = toTaffyStyle(pageNode.style, pageW);
  rootStyle.size = { width: pageW, height: pageH };
  rootStyle.position = taffy.Position.Relative;

  const padding = resolveEdges(pageNode.style, 'padding', pageW);
  const contentW = pageW - padding.left - padding.right;

  const pageStyle: ResolvedStyle = pageNode.style;
  const childResults: BuildResult[] = [];
  const childTaffyIds: bigint[] = [];
  for (const child of pageNode.children) {
    const r = buildNode(child, tree, contentW, pageStyle);
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
        // The text node's own style is empty (reconciler makes text leaves
        // with `style: {}`); visible styling lives on the parent. Use the
        // cascade so measure matches what drawText renders.
        const style: ResolvedStyle = { ...(ctx.inheritedStyle ?? {}), ...textNode.style };
        const familyRaw = (style.fontFamily as string | undefined) ?? 'Helvetica';
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
