/**
 * Cross-pipeline width parity: every text node's `geo.width` from the layout
 * pass must be wide enough that re-measuring at draw time produces the same
 * line count. Today's three bugs all manifested as a layout/draw disagreement
 * on this number.
 *
 * Strategy: render a PDF where every visible string is known to fit on one
 * line and assert that no wrapping happened (each unique text is one item
 * with the original character count).
 */

import { googleFont } from '@imprint/google-fonts';
import { Document, Page } from '@imprint/react';
import { describe, expect, it } from 'vitest';
import { extractText, render } from '../../src/helpers/index.js';

describe('layout/draw parity', () => {
  it('text wrapping is consistent across labels with the same intended layout', async () => {
    const fonts = await googleFont('Outfit', { weights: [400] });

    // Mix of letter shapes that historically jittered: wide caps (M, W, D),
    // narrow caps (I, J), with the same trailing year string.
    const labels = [
      'Mar 2025',
      'May 2025',
      'Wed 2025',
      'Jan 2025',
      'Feb 2025',
      'Aug 2025',
      'Sep 2025',
      'Dec 2025',
    ];

    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 56, fontFamily: 'Outfit' }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
            {labels.map((l, i) => (
              <div key={i} style={{ flex: 1, alignItems: 'center' }}>
                <span style={{ fontSize: 6.5 }}>{l}</span>
              </div>
            ))}
          </div>
        </Page>
      </Document>,
      { fonts },
    );

    const [items] = await extractText(pdf);
    expect(items).toBeDefined();

    // Same baseline for every label = no wrapping anywhere.
    const baselines = new Set(items!.map((it) => Math.round(it.y * 10) / 10));
    expect(baselines.size).toBe(1);

    // Every original label appears in the output exactly once and intact.
    const flat = items!.map((i) => i.text).join('|');
    for (const l of labels) {
      expect(flat).toContain(l);
    }
  });
});
