export interface AssetResolver {
  resolve(src: string): Promise<Uint8Array>;
  resolveText(src: string): Promise<string>;
}

export interface AssetResolverOptions {
  fetch?: typeof globalThis.fetch;
}

function decodeDataUri(src: string): Uint8Array {
  const commaIdx = src.indexOf(',');
  if (commaIdx === -1) throw new Error(`Invalid data URI: ${src.slice(0, 60)}`);
  const meta = src.slice(5, commaIdx);
  const data = src.slice(commaIdx + 1);

  if (meta.includes(';base64')) {
    return Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
  }
  return new TextEncoder().encode(decodeURIComponent(data));
}

async function fetchBytes(url: string, fetchFn: typeof globalThis.fetch): Promise<Uint8Array> {
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * Resolves a `fontsource:` URL to a jsdelivr CDN URL.
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

export function createAssetResolver(options: AssetResolverOptions = {}): AssetResolver {
  const fetchFn: typeof globalThis.fetch | undefined = options.fetch ?? globalThis.fetch;

  async function resolve(src: string): Promise<Uint8Array> {
    if (src.startsWith('data:')) {
      return decodeDataUri(src);
    }

    const isFontsource = src.startsWith('fontsource:') || src.startsWith('fontsource-variable:');
    if (
      isFontsource ||
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('blob:')
    ) {
      const url = isFontsource ? resolveFontsourceUrl(src) : src;
      if (!fetchFn) {
        throw new Error(
          `Cannot fetch ${url}: no fetch implementation available. ` +
            'Pass a fetch polyfill via AssetResolverOptions.fetch',
        );
      }
      return fetchBytes(url, fetchFn);
    }

    if (fetchFn) {
      return fetchBytes(src, fetchFn);
    }

    throw new Error(
      `Cannot resolve asset "${src}": browser rendering supports data URIs, HTTP(S), blob URLs, ` +
        'or a custom fetch implementation.',
    );
  }

  return {
    resolve,
    async resolveText(src: string): Promise<string> {
      return new TextDecoder().decode(await resolve(src));
    },
  };
}
