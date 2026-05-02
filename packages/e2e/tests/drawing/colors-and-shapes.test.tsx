import { Document, Page } from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { inspect, render } from '../../src/helpers/index.js';

describe('background and border drawing', () => {
  it('renders a multi-page document with the correct number of pages', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <span>page one</span>
        </Page>
        <Page size="A4" style={{ padding: 24 }}>
          <span>page two</span>
        </Page>
        <Page size="Letter" style={{ padding: 24 }}>
          <span>page three</span>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.pageCount).toBe(3);
  });

  it('mixed page sizes produce different page dimensions', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <span>one</span>
        </Page>
        <Page size="Letter" style={{ padding: 24 }}>
          <span>two</span>
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    const [a, b] = meta.pages;
    expect(a!.width).toBeCloseTo(595.28, 1);
    expect(b!.width).toBeCloseTo(612, 1);
  });

  it('renders without crashing with hex, rgb, hsl, and oklch colors', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ backgroundColor: '#ff0000', width: 50, height: 20 }} />
          <div style={{ backgroundColor: 'rgb(0, 128, 0)', width: 50, height: 20 }} />
          <div style={{ backgroundColor: 'hsl(240, 100%, 50%)', width: 50, height: 20 }} />
          <div style={{ backgroundColor: 'oklch(70% 0.15 30)', width: 50, height: 20 }} />
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.pageCount).toBe(1);
  });

  it('per-corner border-radius does not crash', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div
            style={{
              width: 100,
              height: 60,
              backgroundColor: '#4f46e5',
              borderTopLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
          />
        </Page>
      </Document>,
    );
    const meta = await inspect(pdf);
    expect(meta.pageCount).toBe(1);
  });
});
