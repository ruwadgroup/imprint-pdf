import { describe, expect, it, vi } from 'vitest';
import { googleFont } from './index.js';

const SAMPLE_CSS = `
/* cyrillic-ext */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/outfit/ext.woff2) format('woff2');
  unicode-range: U+0460-052F;
}
/* latin */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/outfit/latin-400.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin */
@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/outfit/latin-700.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin italic */
@font-face {
  font-family: 'Outfit';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
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

describe('googleFont', () => {
  it('returns one FontDeclaration per (family, weight, style) — last block wins (latin)', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    const decls = await googleFont('Outfit', { weights: [400, 700], fetch: fetchFn });

    // Should have 3 declarations: 400 normal, 700 normal, 400 italic
    expect(decls).toHaveLength(3);

    const normal400 = decls.find((d) => d.weight === 400 && d.style === 'normal');
    expect(normal400).toBeDefined();
    // latin block is last → its URL wins
    expect(normal400!.src).toContain('latin-400');

    const bold700 = decls.find((d) => d.weight === 700 && d.style === 'normal');
    expect(bold700).toBeDefined();
    expect(bold700!.src).toContain('latin-700');

    const italic400 = decls.find((d) => d.weight === 400 && d.style === 'italic');
    expect(italic400).toBeDefined();
  });

  it('sets family, format, and weight correctly', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    const [first] = await googleFont('Outfit', { weights: [400], fetch: fetchFn });
    expect(first!.family).toBe('Outfit');
    expect(first!.format).toBe('woff2');
    expect(first!.weight).toBe(400);
  });

  it('builds correct API URL for normal weights only', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleFont('Outfit', { weights: [400, 700], fetch: fetchFn });
    const url = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('family=Outfit:wght@400;700');
    expect(url).toContain('display=swap');
  });

  it('builds correct API URL for italic variants', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleFont('Outfit', { weights: [400], styles: ['normal', 'italic'], fetch: fetchFn });
    const url = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('ital,wght@');
  });

  it('supports multiple families', async () => {
    const fetchFn = makeFetch(SAMPLE_CSS);
    await googleFont(['Outfit', 'Inter'], { weights: [400], fetch: fetchFn });
    const url = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('family=Outfit');
    expect(url).toContain('family=Inter');
  });

  it('throws on non-OK response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }) as unknown as typeof globalThis.fetch;
    await expect(googleFont('NonExistentFont', { fetch: fetchFn })).rejects.toThrow('404');
  });
});
