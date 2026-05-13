/**
 * Regression: a broken image source must NOT abort the PDF render.
 *
 * Bug history:
 *   alpha.9 user report — server-side render of a template that embeds
 *   `blob:https://...` URLs (browser-only, not fetchable from Node) had
 *   the consumer assume the entire `pdf()` call was crashing, even though
 *   drawImage already had a try/catch that logged + swallowed. Alpha.10
 *   tightens this so the failure mode is documented + testable:
 *
 *   - `blob:` / `chrome-extension:` / `moz-extension:` schemes short-circuit
 *     before the fetch attempt with a clear "not fetchable server-side" message.
 *   - Any image / background-image / SVG fetch failure routes through an
 *     `onAssetError` callback if the caller provided one; otherwise it logs.
 *   - In every case the render completes and produces a valid PDF.
 */

import { Document, Image, Page } from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { render } from '../../src/helpers/index.js';

describe('broken image src does not abort the render', () => {
  it('blob: URL — render completes, hook fires, PDF is valid', async () => {
    const errors: { src: string; kind: string }[] = [];
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <Image
            src="blob:https://example.com/0fc7-8c2f"
            alt="user upload"
            style={{ width: 100, height: 100 }}
          />
          <p>page content that should still render</p>
        </Page>
      </Document>,
      {
        onAssetError: ({ src, kind }) => {
          errors.push({ src, kind });
        },
      },
    );

    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(...pdf.subarray(0, 4))).toBe('%PDF');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.src).toBe('blob:https://example.com/0fc7-8c2f');
    expect(errors[0]!.kind).toBe('image');
  });

  it('404 https URL — render completes; default handler swallows; no onAssetError needed', async () => {
    // Override fetch on the resolver to simulate a 404 without hitting the network.
    const failingFetch: typeof globalThis.fetch = async () =>
      new Response('not found', { status: 404, statusText: 'Not Found' });

    const { createAssetResolver } = await import('@imprint-pdf/core');
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <Image
            src="https://example.com/missing.png"
            alt="missing"
            style={{ width: 50, height: 50 }}
          />
          <p>still renders without the image</p>
        </Page>
      </Document>,
      { assetResolver: createAssetResolver({ fetch: failingFetch }) },
    );

    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(...pdf.subarray(0, 4))).toBe('%PDF');
  });

  it('multiple broken images — every one is reported, render still completes', async () => {
    const errors: string[] = [];
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <Image src="blob:one" alt="" style={{ width: 50, height: 50 }} />
          <Image src="blob:two" alt="" style={{ width: 50, height: 50 }} />
          <Image src="blob:three" alt="" style={{ width: 50, height: 50 }} />
          <p>tail content</p>
        </Page>
      </Document>,
      { onAssetError: ({ src }) => errors.push(src) },
    );

    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(...pdf.subarray(0, 4))).toBe('%PDF');
    expect(errors).toEqual(['blob:one', 'blob:two', 'blob:three']);
  });

  it('font fetch failure routes through the same onAssetError hook', async () => {
    const errors: { src: string; kind: string }[] = [];
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <p>still renders without the font</p>
        </Page>
      </Document>,
      {
        fonts: [{ family: 'Broken', src: 'https://example.com/does-not-exist.woff2' }],
        onAssetError: ({ src, kind }) => errors.push({ src, kind }),
      },
    );

    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(...pdf.subarray(0, 4))).toBe('%PDF');
    // The font fetch fails twice — once in metrics-only pre-layout, once in
    // the full embed pass — both should route through the hook.
    expect(errors.some((e) => e.kind === 'font')).toBe(true);
  });

  it('throwing from onAssetError aborts the render — opt-in strict mode', async () => {
    await expect(
      render(
        <Document>
          <Page size="A4" style={{ padding: 24 }}>
            <Image src="blob:abc" alt="" style={{ width: 50, height: 50 }} />
          </Page>
        </Document>,
        {
          onAssetError: ({ src }) => {
            throw new Error(`strict-mode reject: ${src}`);
          },
        },
      ),
    ).rejects.toThrow(/strict-mode reject/);
  });
});
