type WasmModule = typeof import('../pkg/imprint_icu.js');

let wasmModule: WasmModule | null = null;
let initPromise: Promise<void> | null = null;

export async function init(): Promise<void> {
  if (wasmModule) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const mod = await import('../pkg/imprint_icu.js');
    await mod.default();
    wasmModule = mod;
  })();
  return initPromise;
}

function getModule(): WasmModule {
  if (!wasmModule) throw new Error('@imprint-pdf/icu-wasm: call init() before use');
  return wasmModule;
}

export function detectBaseDir(text: string): 'ltr' | 'rtl' {
  return getModule().detect_base_dir(text) === 1 ? 'rtl' : 'ltr';
}

export function lineBreakOpportunities(text: string): number[] {
  return Array.from(getModule().line_break_opportunities(text));
}

export function graphemeBoundaries(text: string): number[] {
  return Array.from(getModule().grapheme_boundaries(text));
}

export function reorderBidi(text: string, baseDir: 'ltr' | 'rtl'): string {
  return getModule().reorder_bidi(text, baseDir === 'rtl' ? 1 : 0);
}
