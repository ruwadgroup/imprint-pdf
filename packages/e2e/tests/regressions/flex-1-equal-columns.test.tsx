/**
 * Regression: `flex-1` columns must distribute width equally even when the
 * shorthand sets `flexBasis: 0` and no explicit longhand is present.
 *
 * Bug history: the longhand `flexBasis` block in taffy-adapter.ts unconditionally
 * overwrote the basis to `auto`, causing flex-1 to size to content instead of
 * sharing space equally.
 */

import { Document, Page } from '@imprint-pdf/react';
import { describe, expect, it } from 'vitest';
import { extractText, render } from '../../src/helpers/index.js';

describe('flex-1 equal-share columns', () => {
  it('distributes available width equally across siblings', async () => {
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <span>A</span>
            </div>
            <div style={{ flex: 1 }}>
              <span>B</span>
            </div>
            <div style={{ flex: 1 }}>
              <span>C</span>
            </div>
            <div style={{ flex: 1 }}>
              <span>D</span>
            </div>
          </div>
        </Page>
      </Document>,
    );

    const [items] = await extractText(pdf);
    expect(items).toBeDefined();
    expect(items!).toHaveLength(4);

    // Sort left-to-right and verify the gaps between consecutive labels are
    // identical (within sub-pixel tolerance). Equal gaps == equal columns.
    const sorted = [...items!].sort((a, b) => a.x - b.x);
    const gaps = sorted.slice(1).map((it, i) => it.x - sorted[i]!.x);
    const minGap = Math.min(...gaps);
    const maxGap = Math.max(...gaps);
    expect(maxGap - minGap).toBeLessThan(1.5);
  });

  it('pure flex-grow numbers without a flex shorthand still respect basis 0', async () => {
    // Author wrote separate longhand: flex-grow:1, flex-shrink:1, flex-basis:0.
    // We accept this as equivalent to `flex: 1`; columns must still be equal.
    const pdf = await render(
      <Document>
        <Page size="A4" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            {['short', 'a longer one', 'tiny', 'medium label'].map((t, i) => (
              <div key={i} style={{ flexGrow: 1, flexShrink: 1, flexBasis: '0%' }}>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </Page>
      </Document>,
    );

    const [items] = await extractText(pdf);
    const sorted = [...items!].sort((a, b) => a.x - b.x);
    const gaps = sorted.slice(1).map((it, i) => it.x - sorted[i]!.x);
    const range = Math.max(...gaps) - Math.min(...gaps);
    expect(range).toBeLessThan(1.5);
  });
});
