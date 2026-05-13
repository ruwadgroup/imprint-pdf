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

function makeBox(id: string, style: PdfNode['style'], children: PdfNode[]): PdfNode {
  return { type: 'view', id, props: {}, style, children };
}

describe('text measure cascade — base bug', () => {
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

describe('text measure cascade — fixed-size centering (badge pattern)', () => {
  // From the user's contract template: 28×28 dark badge containing "01", "02",
  // etc. items-center + justify-center. Before the cascade fix the inner span
  // was measured at 12pt × 1.2 = 14.4pt instead of the 11pt the parent declared,
  // so flex centering placed the text leaf at (28-14.4)/2 ≈ 6.8pt — visibly
  // bottom-shifted vs. the badge midpoint.
  it('11pt text in a 28×28 items-center box centers visually', async () => {
    const badge: PdfNode = {
      type: 'view',
      id: 'badge',
      props: {},
      style: {
        width: '28pt',
        height: '28pt',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      children: [makeSpan('inner', '11pt', makeTextLeaf('inner-t', '01'))],
    };
    const geo = await runTaffyLayout(makePage([badge]), 612, 792);

    const inner = geo.get('inner')!;
    const badgeGeo = geo.get('badge')!;

    // Inner span should be sized for its 11pt content (~13.2pt high), not
    // 14.4pt (the empty-style default). 28 - 13.2 = 14.8 → top = 7.4.
    expect(inner.height).toBeLessThan(14);
    expect(inner.height).toBeGreaterThan(11);

    // Centered within the badge — top offset symmetric to bottom offset.
    const topGap = inner.y - badgeGeo.y;
    const bottomGap = badgeGeo.y + badgeGeo.height - (inner.y + inner.height);
    expect(Math.abs(topGap - bottomGap)).toBeLessThan(0.5);
  });

  it('does not center-shift when fontSize is the default 12pt', async () => {
    // Sanity that the centering code path isn't accidentally biased.
    const badge: PdfNode = {
      type: 'view',
      id: 'badge',
      props: {},
      style: {
        width: '40pt',
        height: '40pt',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      children: [makeSpan('inner', '12pt', makeTextLeaf('inner-t', '99'))],
    };
    const geo = await runTaffyLayout(makePage([badge]), 612, 792);
    const inner = geo.get('inner')!;
    const badgeGeo = geo.get('badge')!;
    const topGap = inner.y - badgeGeo.y;
    const bottomGap = badgeGeo.y + badgeGeo.height - (inner.y + inner.height);
    expect(Math.abs(topGap - bottomGap)).toBeLessThan(0.5);
  });
});

describe('text measure cascade — multi-level inheritance', () => {
  // The cascade must walk through arbitrary depth, not just one parent.
  // Real templates frequently look like: page → section → row → label → text.
  it('inherits fontSize through three intermediate views', async () => {
    const text = makeTextLeaf('deep-t', 'tiny');
    const span = makeSpan('span', '6.5pt', text);
    const inner = makeBox('inner', { display: 'flex', flexDirection: 'column' }, [span]);
    const middle = makeBox('middle', { display: 'flex', flexDirection: 'column' }, [inner]);
    const outer = makeBox('outer', { display: 'flex', flexDirection: 'column' }, [middle]);
    const geo = await runTaffyLayout(makePage([outer]), 612, 792);
    expect(geo.get('span')!.height).toBeLessThan(10);
  });

  it('child fontSize overrides ancestor fontSize for that subtree', async () => {
    const inner = makeSpan('inner', '6.5pt', makeTextLeaf('inner-t', 'small'));
    const outer: PdfNode = {
      type: 'view',
      id: 'outer',
      props: {},
      style: {
        fontSize: '24pt',
        display: 'flex',
        flexDirection: 'column',
      },
      children: [inner],
    };
    const geo = await runTaffyLayout(makePage([outer]), 612, 792);
    // outer cascade is 24pt, but inner explicitly overrides to 6.5pt.
    expect(geo.get('inner')!.height).toBeLessThan(10);
  });

  it('inherits fontFamily through the cascade so measure agrees with draw', async () => {
    // Regression on font-inheritance.test.tsx — duplicated here as a pure
    // geometry assertion so a layout-only break can't silently regress the
    // typography test.
    const text = makeTextLeaf('t', 'Mar 2025');
    const span: PdfNode = {
      type: 'view',
      id: 'span',
      props: {},
      style: { fontSize: '8pt', display: 'flex', flexDirection: 'column' },
      children: [text],
    };
    const page: PdfNode = {
      type: 'page',
      id: 'p',
      props: { size: 'A4' },
      style: {
        padding: '48pt',
        fontFamily: 'Outfit',
        display: 'flex',
        flexDirection: 'column',
      },
      children: [span],
    };
    const geo = await runTaffyLayout(page, 612, 792);
    expect(geo.get('span')!.height).toBeGreaterThan(0);
    expect(geo.get('span')!.height).toBeLessThan(12);
  });
});

describe('text measure cascade — lineHeight + multi-line', () => {
  it('honours explicit lineHeight from the parent span', async () => {
    const tight: PdfNode = {
      type: 'view',
      id: 'tight',
      props: {},
      style: {
        fontSize: '10pt',
        lineHeight: '1',
        display: 'flex',
        flexDirection: 'column',
      },
      children: [makeTextLeaf('tight-t', 'A')],
    };
    const loose: PdfNode = {
      type: 'view',
      id: 'loose',
      props: {},
      style: {
        fontSize: '10pt',
        lineHeight: '2',
        display: 'flex',
        flexDirection: 'column',
      },
      children: [makeTextLeaf('loose-t', 'A')],
    };
    const geo = await runTaffyLayout(makePage([tight, loose]), 612, 792);
    const tightH = geo.get('tight')!.height;
    const looseH = geo.get('loose')!.height;
    expect(looseH).toBeGreaterThan(tightH);
    // 2× lineHeight on the same fontSize ≈ 2× height (allow some tolerance).
    expect(looseH).toBeGreaterThan(tightH * 1.6);
  });

  it('multi-line text accumulates lineHeight per line', async () => {
    const lines = ['Lorem ipsum dolor sit amet', 'consectetur adipiscing elit'].join('\n');
    const singleLine: PdfNode = {
      type: 'view',
      id: 'one',
      props: {},
      style: {
        fontSize: '10pt',
        display: 'flex',
        flexDirection: 'column',
        width: '400pt',
      },
      children: [makeTextLeaf('one-t', 'Lorem ipsum')],
    };
    const multiLine: PdfNode = {
      type: 'view',
      id: 'two',
      props: {},
      style: {
        fontSize: '10pt',
        display: 'flex',
        flexDirection: 'column',
        width: '400pt',
      },
      children: [makeTextLeaf('two-t', lines)],
    };
    const geo = await runTaffyLayout(makePage([singleLine, multiLine]), 612, 792);
    expect(geo.get('two')!.height).toBeGreaterThan(geo.get('one')!.height * 1.6);
  });
});

describe('text measure cascade — form-field overlap (real-world)', () => {
  // Reproduces the exact pattern from the user's contract template that
  // visibly overlapped at alpha.5. Asserts the value sits clearly below the
  // label, not under it. Includes `Label` padding so the gap is asserted on
  // CONTENT positions, not box edges.
  it('label + value with mt-1 in a px-4 py-2.5 rounded container', async () => {
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
    const card: PdfNode = {
      type: 'view',
      id: 'card',
      props: {},
      style: {
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: '16pt',
        paddingRight: '16pt',
        paddingTop: '10pt',
        paddingBottom: '10pt',
      },
      children: [label, value],
    };
    const geo = await runTaffyLayout(makePage([card]), 612, 792);

    const labelGeo = geo.get('label')!;
    const valueGeo = geo.get('value')!;

    // Value's top edge must be strictly below the label's bottom edge.
    expect(valueGeo.y).toBeGreaterThan(labelGeo.y + labelGeo.height);

    // And there's actual visible spacing — the marginTop should make the gap
    // > 2pt, otherwise glyphs touch even with proper height.
    expect(valueGeo.y - (labelGeo.y + labelGeo.height)).toBeGreaterThan(2);

    // The card sized to fit both children + vertical padding (10+10=20).
    const expectedMin = labelGeo.height + 4 /* mt */ + valueGeo.height + 20;
    expect(geo.get('card')!.height).toBeGreaterThanOrEqual(expectedMin - 0.5);
  });
});
