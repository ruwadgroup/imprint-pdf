export interface AssetResolver {
  resolve(src: string): Promise<Uint8Array>;
  resolveText(src: string): Promise<string>;
}

export interface AssetResolverOptions {
  basePath?: string;
  fetch?: typeof globalThis.fetch;
}

// No top-level `node:fs` — this file ships to browser/edge too.
const isNode =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.node !== 'undefined';

function decodeDataUri(src: string): Uint8Array {
  const commaIdx = src.indexOf(',');
  if (commaIdx === -1) throw new Error(`Invalid data URI: ${src.slice(0, 60)}`);
  const meta = src.slice(5, commaIdx);
  const data = src.slice(commaIdx + 1);

  if (meta.includes(';base64')) {
    const binStr = atob(data);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(data));
}

async function readFileNode(filePath: string): Promise<Uint8Array> {
  // Dynamic import so bundlers tree-shake `node:fs` out of browser builds.
  const { readFile } = await import('node:fs/promises');
  const buf = await readFile(filePath);
  // Node's `Buffer` is a view into a shared pool — `buf.buffer` is often much
  // larger than the file. Copy into a fresh ArrayBuffer so WASM consumers
  // (HarfBuzz, fontkit) that walk `.buffer` don't read pool padding and
  // RangeError on us.
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return bytes;
}

async function fetchBytes(url: string, fetchFn: typeof globalThis.fetch): Promise<Uint8Array> {
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Resolves a `fontsource:` URL to a jsdelivr CDN URL — no hand-written CDN paths.
 *
 * Shape: `fontsource:<family>[@<version>][:<weight>[:<style>[:<subset>[:<format>]]]]`.
 * Defaults: version=`5`, weight=`400`, style=`normal`, subset=`latin`, format=`woff2`.
 *
 * Variable fonts use the `fontsource-variable:` prefix and an axis name (e.g. `wght`)
 * in the weight slot: `fontsource-variable:inter@5:wght`.
 *
 * Family is the Fontsource slug (kebab-case): `inter`, `jetbrains-mono`, `noto-sans-arabic`.
 *
 * @example
 *   fontsource:inter                              // Inter regular, latin, WOFF2
 *   fontsource:inter@5:700                        // Inter bold
 *   fontsource:inter@5:400:italic                 // Inter italic
 *   fontsource:noto-sans-arabic@5:400:normal:arabic
 *   fontsource-variable:inter@5:wght              // Inter variable (wght axis)
 */
export function resolveFontsourceUrl(src: string): string {
  const isVariable = src.startsWith('fontsource-variable:');
  const body = src.slice(isVariable ? 'fontsource-variable:'.length : 'fontsource:'.length);

  const [familyAndVersion, ...rest] = body.split(':');
  const [familyRaw, versionRaw] = (familyAndVersion ?? '').split('@');
  const family = (familyRaw ?? '').trim();
  if (!family) {
    throw new Error(`fontsource URL is missing a family name: ${src}`);
  }
  const version = versionRaw?.trim() || '5';
  const weight = (rest[0] ?? (isVariable ? 'wght' : '400')).trim();
  const style = (rest[1] ?? 'normal').trim();
  const subset = (rest[2] ?? 'latin').trim();
  const format = (rest[3] ?? 'woff2').trim();

  const pkg = isVariable ? `@fontsource-variable/${family}` : `@fontsource/${family}`;
  return `https://cdn.jsdelivr.net/npm/${pkg}@${version}/files/${family}-${subset}-${weight}-${style}.${format}`;
}

function resolveFilePath(src: string, basePath?: string): string {
  if (src.startsWith('file://')) {
    return new URL(src).pathname;
  }
  if (basePath && !src.startsWith('/')) {
    return `${basePath.replace(/\/$/, '')}/${src}`;
  }
  return src;
}

export function createAssetResolver(options: AssetResolverOptions = {}): AssetResolver {
  const { basePath, fetch: customFetch } = options;
  const fetchFn: typeof globalThis.fetch = customFetch ?? globalThis.fetch;

  async function resolve(src: string): Promise<Uint8Array> {
    if (src.startsWith('data:')) {
      return decodeDataUri(src);
    }

    // `fontsource:` / `fontsource-variable:` rewrite to jsdelivr URLs.
    if (src.startsWith('fontsource:') || src.startsWith('fontsource-variable:')) {
      const url = resolveFontsourceUrl(src);
      if (!fetchFn) {
        throw new Error(
          `Cannot fetch ${url}: no fetch implementation available. ` +
            'Pass a fetch polyfill via AssetResolverOptions.fetch',
        );
      }
      return fetchBytes(url, fetchFn);
    }

    if (src.startsWith('http://') || src.startsWith('https://')) {
      if (!fetchFn) {
        throw new Error(
          `Cannot fetch ${src}: no fetch implementation available. ` +
            'Pass a fetch polyfill via AssetResolverOptions.fetch',
        );
      }
      return fetchBytes(src, fetchFn);
    }

    if (src.startsWith('file://') || (!src.startsWith('blob:') && isNode)) {
      const filePath = resolveFilePath(src, basePath);
      return readFileNode(filePath);
    }

    if (fetchFn) {
      return fetchBytes(src, fetchFn);
    }

    throw new Error(
      `Cannot resolve asset "${src}": not a data URI, HTTP URL, or file path, ` +
        'and no fetch implementation is available.',
    );
  }

  async function resolveText(src: string): Promise<string> {
    const bytes = await resolve(src);
    return new TextDecoder().decode(bytes);
  }

  return { resolve, resolveText };
}
