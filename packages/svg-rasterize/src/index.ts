import { initWasm, Resvg } from '@resvg/resvg-wasm';

// Cached so concurrent first calls share the load — initWasm throws on
// a second invocation.
let initPromise: Promise<void> | null = null;

export interface RasterizeOptions {
  width: number;
  height: number;
  /**
   * Source for the resvg `.wasm` binary — URL, `Response`, `BufferSource`,
   * or precompiled `WebAssembly.Module`. On Node, omit to load the bundled
   * binary via Node resolution.
   */
  wasm?: Parameters<typeof initWasm>[0];
}

async function ensureInit(input?: Parameters<typeof initWasm>[0]): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (input !== undefined) {
      await initWasm(input);
      return;
    }
    try {
      const { readFile } = await import('node:fs/promises');
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      const wasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
      const bytes = await readFile(wasmPath);
      await initWasm(bytes as unknown as BufferSource);
    } catch (err) {
      initPromise = null;
      throw new Error(
        '[imprint/svg-rasterize] could not load resvg.wasm. Pass `wasm` in RasterizeOptions ' +
          'or call initRasterizer(...) from a context that can locate the binary.\n' +
          `Underlying: ${(err as Error).message}`,
      );
    }
  })();
  return initPromise;
}

/** Pre-loads the WASM module so later `rasterize` calls don't need to pass `wasm`. */
export async function initRasterizer(input: Parameters<typeof initWasm>[0]): Promise<void> {
  initPromise = null;
  await ensureInit(input);
}

/** Rasterizes an SVG string to PNG bytes at the requested width (height tracks the SVG's aspect ratio). */
export async function rasterize(svg: string, options: RasterizeOptions): Promise<Uint8Array> {
  await ensureInit(options.wasm);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: options.width },
  });
  const png = resvg.render().asPng();
  resvg.free();
  return png;
}
