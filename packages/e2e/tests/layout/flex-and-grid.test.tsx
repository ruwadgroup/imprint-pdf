import { Document, Page } from '@imprint/react';
import { describe, expect, it } from 'vitest';
import { extractText, render } from '../../src/helpers/index.js';

describe('flex and grid layout', () => {
  it('flex-direction:column stacks children vertically', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span>top</span>
            <span>middle</span>
            <span>bottom</span>
          </div>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    expect(items).toHaveLength(3);
    const sorted = [...items!].sort((a, b) => b.y - a.y);
    expect(sorted.map((i) => i.text)).toEqual(['top', 'middle', 'bottom']);
  });

  it('flex-direction:row-reverse positions first child rightmost', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8 }}>
            <span>first</span>
            <span>second</span>
            <span>third</span>
          </div>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    const byX = [...items!].sort((a, b) => b.x - a.x);
    expect(byX.map((i) => i.text)).toEqual(['first', 'second', 'third']);
  });

  it('justify-content:space-between distributes equally', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <span>L</span>
            <span>M</span>
            <span>R</span>
          </div>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    const sorted = [...items!].sort((a, b) => a.x - b.x);
    const leftGap = sorted[1]!.x - sorted[0]!.x;
    const rightGap = sorted[2]!.x - sorted[1]!.x;
    expect(Math.abs(leftGap - rightGap)).toBeLessThan(2);
  });

  it('grid-template-columns lays children into named tracks', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr' }}>
            <span>a</span>
            <span>b</span>
            <span>c</span>
          </div>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    expect(items).toHaveLength(3);
    const [a, b, c] = [...items!].sort((x, y) => x.x - y.x);
    // Middle track is twice as wide; gap between b's start and c's start
    // should be roughly twice the gap between a's start and b's start.
    const gapAB = b!.x - a!.x;
    const gapBC = c!.x - b!.x;
    expect(gapBC / gapAB).toBeGreaterThan(1.5);
    expect(gapBC / gapAB).toBeLessThan(2.5);
  });

  it('absolute positioning escapes the flow', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ position: 'relative', height: 200 }}>
            <span style={{ position: 'absolute', left: 50, top: 50 }}>pinned</span>
            <span>flow</span>
          </div>
        </Page>
      </Document>,
    );
    const [items] = await extractText(pdf);
    const pinned = items!.find((i) => i.text === 'pinned')!;
    const flow = items!.find((i) => i.text === 'flow')!;
    expect(pinned.x).toBeCloseTo(24 + 50, 0);
    expect(flow.x).toBeCloseTo(24, 0);
  });
});
