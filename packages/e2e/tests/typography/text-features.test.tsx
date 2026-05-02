import { Document, Page } from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { extractText, render } from '../../src/helpers/index.js';

describe('typography features', () => {
  it('text-align:center centers the text within its container', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ width: 200 }}>
            <span style={{ textAlign: 'center', fontSize: 12 }}>centered</span>
          </div>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    const t = items![0]!;
    const containerLeft = 24;
    const containerWidth = 200;
    const expectedCenter = containerLeft + (containerWidth - t.width) / 2;
    expect(Math.abs(t.x - expectedCenter)).toBeLessThan(2);
  });

  it('text-transform:uppercase rewrites the rendered string', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <span style={{ textTransform: 'uppercase' }}>shout</span>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    expect(items!.map((i) => i.text).join('')).toContain('SHOUT');
  });

  it('newlines in the source produce separate baselines', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <span>{'first line\nsecond line\nthird'}</span>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    const baselines = new Set(items!.map((i) => Math.round(i.y * 10) / 10));
    expect(baselines.size).toBe(3);
  });

  it('long text wraps inside a fixed-width container', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ width: 80 }}>
            <span style={{ fontSize: 10 }}>
              The quick brown fox jumps over the lazy dog and keeps running
            </span>
          </div>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    const baselines = new Set(items!.map((i) => Math.round(i.y * 10) / 10));
    // 80pt wide at 10pt is roughly 7-8 chars per line; the sentence has 60+
    // chars so we should see at least three lines.
    expect(baselines.size).toBeGreaterThanOrEqual(3);
  });
});
