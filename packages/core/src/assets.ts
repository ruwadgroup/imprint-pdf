export interface AssetResolver {
  resolve(src: string): Promise<Uint8Array>;
  resolveText(src: string): Promise<string>;
}

export interface AssetResolverOptions {
  basePath?: string;
  fetch?: typeof globalThis.fetch;
}

// avoid importing node:fs at module level so this file stays usable in browser/edge
const isNode =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.node !== 'undefined';

function decodeDataUri(src: string): Uint8Array {
  // data:[<mediatype>][;base64],<data>
  const commaIdx = src.indexOf(',');
  if (commaIdx === -1) throw new Error(`Invalid data URI: ${src.slice(0, 60)}`);
  const meta = src.slice(5, commaIdx); // strip "data:"
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
  // dynamic import so bundlers can tree-shake for browser builds
  const { readFile } = await import('node:fs/promises');
  const buf = await readFile(filePath);
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

async function fetchBytes(url: string, fetchFn: typeof globalThis.fetch): Promise<Uint8Array> {
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
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
