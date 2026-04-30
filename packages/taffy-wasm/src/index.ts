export interface TaffyStyle {
  display?: 'flex' | 'grid' | 'block' | 'none';
  position?: 'relative' | 'absolute';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'no-wrap' | 'wrap' | 'wrap-reverse';
  alignItems?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto';
  width?: number | 'auto';
  height?: number | 'auto';
  minWidth?: number | 'auto';
  maxWidth?: number | 'auto';
  minHeight?: number | 'auto';
  maxHeight?: number | 'auto';
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number | 'auto';
  marginRight?: number | 'auto';
  marginBottom?: number | 'auto';
  marginLeft?: number | 'auto';
  gapRow?: number;
  gapColumn?: number;
  insetTop?: number | 'auto';
  insetRight?: number | 'auto';
  insetBottom?: number | 'auto';
  insetLeft?: number | 'auto';
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
}

export interface TaffyLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  contentWidth: number;
  contentHeight: number;
}

export type MeasureFn = (
  knownWidth: number | null,
  knownHeight: number | null,
  availWidth: number,
  availHeight: number,
  nodeId: bigint,
  context: unknown,
) => { width: number; height: number };

type WasmModule = typeof import('../pkg/imprint_taffy.js');
type RawEngine = InstanceType<WasmModule['TaffyEngine']>;

let wasmModule: WasmModule | null = null;
let initPromise: Promise<void> | null = null;

export async function init(): Promise<void> {
  if (wasmModule) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const mod = await import('../pkg/imprint_taffy.js');
    await mod.default();
    wasmModule = mod;
  })();
  return initPromise;
}

function getModule(): WasmModule {
  if (!wasmModule) throw new Error('@imprint/taffy-wasm: call init() before using the engine');
  return wasmModule;
}

export class TaffyEngineWrapper {
  #raw: RawEngine;

  constructor() {
    const mod = getModule();
    this.#raw = new mod.TaffyEngine();
  }

  newLeaf(style: TaffyStyle): bigint {
    return this.#raw.newLeaf(style) as bigint;
  }

  newLeafWithContext(style: TaffyStyle, context: unknown): bigint {
    return this.#raw.newLeafWithContext(style, context) as bigint;
  }

  newWithChildren(style: TaffyStyle, children: bigint[]): bigint {
    return this.#raw.newWithChildren(style, children.map(Number)) as bigint;
  }

  computeLayout(root: bigint, width: number, height: number): void {
    this.#raw.computeLayout(Number(root), width, height);
  }

  computeLayoutWithMeasure(root: bigint, width: number, height: number, measure: MeasureFn): void {
    this.#raw.computeLayoutWithMeasure(Number(root), width, height, measure);
  }

  getLayout(node: bigint): TaffyLayout {
    return this.#raw.getLayout(Number(node)) as TaffyLayout;
  }

  freeNode(node: bigint): void {
    this.#raw.freeNode(Number(node));
  }

  clear(): void {
    this.#raw.clear();
  }

  free(): void {
    this.#raw.free();
  }
}

export function createEngine(): TaffyEngineWrapper {
  return new TaffyEngineWrapper();
}
