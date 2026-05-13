import { describe, expect, it } from 'vitest';
import type { PdfNode } from '../types.js';
import { runTaffyLayout } from './taffy-adapter.js';

// Reconciler-shape: text leaves carry `style: {}`; the visible style lives on
// the parent element. Measure must use the cascade or layout boxes are sized
// at the 12pt × 1.2 default while drawText renders the cascaded fontSize.
function makeTextLeaf(id: string, text: string): PdfNode {
  return { type: 'text', id, text, props: {}, style: {}, children: [] };
}

function makeSpan(id: string, fontSize: string, child: PdfNode): PdfNode {
  return {
    type: 'view',
    id,
    props: {},
    style: { fontSize, display: 'flex', flexDirection: 'column' },
    children: [child],
  };
}

function makePage(children: PdfNode[]): PdfNode {
  return {
    type: 'page',
    id: 'p',
    props: { size: 'Letter' },
    style: { padding: '0pt', display: 'flex', flexDirection: 'column' },
    children,
  };
}

describe('text measure cascade', () => {
  it('uses the parent span fontSize, not the default 12pt', async () => {
    const tiny = makeSpan('tiny', '6.5pt', makeTextLeaf('tiny-t', 'SELECT SERVICES'));
    const big = makeSpan('big', '24pt', makeTextLeaf('big-t', 'SELECT SERVICES'));
    const page = makePage([tiny, big]);
    const geo = await runTaffyLayout(page, 612, 792);

    const tinyH = geo.get('tiny')!.height;
    const bigH = geo.get('big')!.height;

    // Before the fix tinyH and bigH were both ~14.4pt (default 12pt × 1.2).
    expect(tinyH).toBeLessThan(bigH * 0.5);
    expect(tinyH).toBeGreaterThan(0);
    expect(tinyH).toBeLessThan(10);
    expect(bigH).toBeGreaterThan(25);
  });

  it('stacks two styled labels without overlap in a flex column', async () => {
    const label = makeSpan('label', '6.5pt', makeTextLeaf('label-t', 'SELECT SERVICES'));
    const value: PdfNode = {
      type: 'view',
      id: 'value',
      props: {},
      style: {
        fontSize: '10pt',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '4pt',
      },
      children: [makeTextLeaf('value-t', 'Pest 1, Pest 2')],
    };
    const container: PdfNode = {
      type: 'view',
      id: 'container',
      props: {},
      style: { display: 'flex', flexDirection: 'column', padding: '10pt' },
      children: [label, value],
    };
    const geo = await runTaffyLayout(makePage([container]), 612, 792);

    const labelGeo = geo.get('label')!;
    const valueGeo = geo.get('value')!;
    expect(valueGeo.y).toBeGreaterThanOrEqual(labelGeo.y + labelGeo.height);
  });
});
