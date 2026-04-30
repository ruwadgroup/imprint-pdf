/**
 * Regression: layout-time text measurement must use the same font the writer
 * will draw with. Otherwise layout sizes a text node based on charWidth
 * heuristics and the writer re-measures with HarfBuzz, producing a different
 * width — which may cross the wrap threshold for some labels but not others.
 *
 * Bug history: text nodes inherited fontFamily from <Page> at draw time but
 * not at layout time, so labels like "Mar 2025" wrapped while "Jan 2025"
 * stayed on one line in the same equal-width flex columns.
 */

import { googleFont } from '@imprint/google-fonts';
import { Document, Page } from '@imprint/react';
import { describe, expect, it } from 'vitest';
import { extractText, render } from '../../src/helpers/index.js';

const MONTHS = ['Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'];

describe('font-family inherits during layout', () => {
  it('all equal-length month labels render on a single line under a flex-1 row', async () => {
    const fonts = await googleFont('Outfit', { weights: [400, 700] });

    const pdf = await render(
      <Document>
        <Page
          size="A4"
          style={{ paddingLeft: 56, paddingRight: 56, paddingTop: 48, fontFamily: 'Outfit' }}
        >
          <div style={{ padding: 20, backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
              {MONTHS.map((m, i) => (
                <div key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <span style={{ fontSize: 6.5, color: '#475569', textAlign: 'center' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </Page>
      </Document>,
      { fonts },
    );

    const [items] = await extractText(pdf);
    expect(items).toBeDefined();

    // Group items by their baseline y. Each unique baseline = one rendered line
    // for that month. If any label wraps, it produces two baselines.
    const baselines = new Set(items!.map((it) => Math.round(it.y * 10) / 10));
    expect(baselines.size).toBe(1);

    // Sanity: every month string is present, none broken into "Mar" + "2025".
    const flat = items!.map((i) => i.text).join(' ');
    for (const m of MONTHS) {
      expect(flat).toContain(m);
    }
  });

  it('inherits fontFamily across multiple wrapping levels', async () => {
    // The Page sets fontFamily, then a div, then another, then the text.
    // Each level should pass the family through.
    const fonts = await googleFont('Outfit', { weights: [400] });

    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 48, fontFamily: 'Outfit' }}>
          <div>
            <div>
              <div>
                <span style={{ fontSize: 8 }}>Mar 2025</span>
              </div>
            </div>
          </div>
        </Page>
      </Document>,
      { fonts },
    );

    const [items] = await extractText(pdf);
    expect(items).toBeDefined();
    expect(items!).toHaveLength(1);
    expect(items![0]!.text).toBe('Mar 2025');
  });
});
