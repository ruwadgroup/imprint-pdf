import { describe, expect, it } from 'vitest';
import { renderECharts, renderObservablePlot, renderToSvgString } from './index.js';

describe('renderToSvgString', () => {
  it('extracts the <svg> root from SSR markup', () => {
    const out = renderToSvgString(
      <svg viewBox="0 0 10 10">
        <title>square</title>
        <rect width="10" height="10" />
      </svg>,
    );
    expect(out).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(out).toContain('viewBox="0 0 10 10"');
  });

  it('strips wrapper elements that React injects', () => {
    const out = renderToSvgString(
      (
        <div>
          <svg viewBox="0 0 1 1">
            <title>dot</title>
          </svg>
        </div>
      ) as unknown as Parameters<typeof renderToSvgString>[0],
    );
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
  });
});

describe('renderObservablePlot', () => {
  it('passes through outerHTML when it is an svg root', () => {
    expect(renderObservablePlot({ outerHTML: '<svg><g/></svg>' })).toBe('<svg><g/></svg>');
  });

  it('falls back to querySelector when outerHTML wraps the svg', () => {
    const figure = {
      outerHTML: '<figure><svg id="x"/></figure>',
      querySelector: (_s: string) => ({ outerHTML: '<svg id="x"/>' }),
    };
    expect(renderObservablePlot(figure)).toBe('<svg id="x"/>');
  });
});

describe('renderECharts', () => {
  it('extracts <svg>…</svg> from ECharts output', () => {
    const ssr = '<!--start--><svg width="100" height="100"></svg><!--end-->';
    expect(renderECharts(ssr)).toBe('<svg width="100" height="100"></svg>');
  });
});
