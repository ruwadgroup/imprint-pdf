import { describe, expect, it, vi } from 'vitest';
import { bunnyProvider, googleProvider, loadFont, localProvider } from './index.js';

const SAMPLE_CSS = `
/* cyrillic-ext */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/outfit/ext.woff2) format('woff2');
  unicode-range: U+0460-052F;
}
/* latin */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/outfit/latin-400.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 700;
  src: url(https://fonts.gstatic.com/s/outfit/latin-700.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin italic */
@font-face {
  font-family: 'Outfit';
  font-style: italic;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/outfit/latin-400i.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
`;

function makeFetch(css: string): typeof globalThis.fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    text: async () => css,
  }) as unknown as typeof globalThis.fetch;
}

// Pulls the first call's `(url, init)` pair off a mocked fetch with proper
// type narrowing — `mock.calls[0]` is `unknown[]` under noUncheckedIndexedAccess.
function firstCall(fetchFn: typeof globalThis.fetch): [string, RequestInit | undefined] {
  const mock = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock;
  const call = mock.calls[0];
  if (!call) throw new Error('fetch was not called');
  return [call[0] as string, call[1] as RequestInit | undefined];
}

describe('googleProvider', () => {
  it('returns one FontDeclaration per (family, weight, style) — latin block wins', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    const decls = await googleProvider().load('Outfit', {
      weights: [400, 700],
      fetch: fetchFn,
    });
    expect(decls).toHaveLength(3);

    const normal400 = decls.find((d) => d.weight === 400 && d.style === 'normal');
    expect(normal400!.src).toContain('latin-400');

    const bold700 = decls.find((d) => d.weight === 700 && d.style === 'normal');
    expect(bold700!.src).toContain('latin-700');

    const italic400 = decls.find((d) => d.weight === 400 && d.style === 'italic');
    expect(italic400).toBeDefined();
  });

  it('builds correct URL for normal weights only', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleProvider().load('Outfit', { weights: [400, 700], fetch: fetchFn });
    const [url] = firstCall(fetchFn);
    expect(url).toContain('family=Outfit:wght@400;700');
    expect(url).toContain('display=swap');
  });

  it('builds correct URL for italic variants', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleProvider().load('Outfit', {
      weights: [400],
      styles: ['normal', 'italic'],
      fetch: fetchFn,
    });
    const [url] = firstCall(fetchFn);
    expect(url).toContain('ital,wght@');
  });

  it('builds correct URL with variable-axis ranges', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleProvider().load('Outfit', {
      axes: { wght: [100, 900], wdth: [75, 125] },
      fetch: fetchFn,
    });
    const [url] = firstCall(fetchFn);
    expect(url).toContain('family=Outfit:wdth,wght@75..125,100..900');
  });

  it('supports multiple families', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleProvider().load(['Outfit', 'Inter'], { weights: [400], fetch: fetchFn });
    const [url] = firstCall(fetchFn);
    expect(url).toContain('family=Outfit');
    expect(url).toContain('family=Inter');
  });

  it('throws on non-OK response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }) as unknown as typeof globalThis.fetch;
    await expect(googleProvider().load('NonExistent', { fetch: fetchFn })).rejects.toThrow('404');
  });

  it('respects a custom baseUrl', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleProvider({ baseUrl: 'https://my-mirror.test/css2' }).load('Outfit', {
      fetch: fetchFn,
    });
    const [url] = firstCall(fetchFn);
    expect(url.startsWith('https://my-mirror.test/css2?')).toBe(true);
  });
});

describe('bunnyProvider', () => {
  it('hits the Bunny CSS endpoint without a UA dance', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await bunnyProvider().load('Outfit', { weights: [400], fetch: fetchFn });
    const [url, init] = firstCall(fetchFn);
    expect(url.startsWith('https://fonts.bunny.net/css?')).toBe(true);
    // Bunny doesn't need the UA spoof
    expect(init?.headers).toBeUndefined();
  });
});

describe('localProvider', () => {
  it('produces a file:// FontDeclaration with format inferred from extension', async () => {
    const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = mkdtempSync(join(tmpdir(), 'imprint-font-'));
    const file = join(dir, 'Brand-400.ttf');
    writeFileSync(file, new Uint8Array([0]));
    try {
      const decls = await localProvider([{ family: 'Brand', src: file, weight: 400 }]).load(
        'Brand',
      );
      expect(decls).toHaveLength(1);
      expect(decls[0]!.family).toBe('Brand');
      expect(decls[0]!.src.startsWith('file://')).toBe(true);
      expect(decls[0]!.format).toBe('ttf');
      expect(decls[0]!.weight).toBe(400);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws when the file is missing so the user finds typos early', async () => {
    await expect(
      localProvider([{ family: 'Missing', src: '/nope/missing.ttf' }]).load('Missing'),
    ).rejects.toThrow(/local file not found/);
  });
});

describe('loadFont convenience', () => {
  it('forwards to provider.load', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    const decls = await loadFont(googleProvider(), 'Outfit', { fetch: fetchFn });
    expect(decls.length).toBeGreaterThan(0);
  });
});
