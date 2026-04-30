/**
 * Regression: Taffy's default pixel-rounding rounded text container widths to
 * whole points, while text widths stayed fractional. Re-measuring at the
 * floored width inside the writer pushed K-P just over the wrap threshold —
 * even when intrinsic max-content was wider, only by ~0.5pt.
 *
 * Bug history: legend labels like "Q1 2025" wrapped to two lines because
 * `extractGeometries` returned `geo.width = 25` for an intrinsic 25.54 text.
 *
 * Fix: layoutPage calls `tree.disableRounding()`. This test pins that.
 */

import { googleFont } from '@imprint/google-fonts';
import { Document, Page } from '@imprint/react';
import { describe, expect, it } from 'vitest';
import { extractText, render } from '../../src/helpers/index.js';

describe('Taffy rounding stays disabled', () => {
  it('preserves fractional intrinsic widths so single-line text does not wrap', async () => {
    const fonts = await googleFont('Outfit', { weights: [400] });

    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 48, fontFamily: 'Outfit' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 6, backgroundColor: '#4f46e5' }} />
              <span style={{ fontSize: 7 }}>Q1 2025</span>
            </div>
          </div>
        </Page>
      </Document>,
      { fonts },
    );

    const [items] = await extractText(pdf);
    expect(items).toBeDefined();

    const baselines = new Set(items!.map((it) => Math.round(it.y * 10) / 10));
    expect(baselines.size).toBe(1);

    // The whole label sits on one line in document order.
    const flat = items!
      .map((i) => i.text)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    expect(flat).toContain('Q1 2025');
  });

  it('handles a row of mixed-width labels without flooring widths', async () => {
    // Each label has a slightly different intrinsic width. With pixel rounding
    // enabled, the borderline ones would shed a sub-pixel and wrap.
    const fonts = await googleFont('Outfit', { weights: [400] });
    const labels = ['MMW', 'MMM', 'WWW', 'mmm', 'iii'];

    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 48, fontFamily: 'Outfit' }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
            {labels.map((l, i) => (
              <div key={i} style={{ flex: 1, alignItems: 'center' }}>
                <span style={{ fontSize: 8 }}>{l}</span>
              </div>
            ))}
          </div>
        </Page>
      </Document>,
      { fonts },
    );

    const [items] = await extractText(pdf);
    const baselines = new Set(items!.map((it) => Math.round(it.y * 10) / 10));
    expect(baselines.size).toBe(1);
  });
});
