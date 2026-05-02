import { Svg } from '@imprint-pdf/react';
import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export interface ChartProps {
  width: number | string;
  height: number | string;
  /** Chart React element (Recharts, Visx, etc.) — must SSR to an `<svg>` root. */
  children: ReactNode;
  className?: string;
  style?: Record<string, unknown>;
}

/**
 * SSRs an SVG-emitting chart React subtree (Recharts, Visx, d3, etc.) and
 * embeds the result via `<Svg>`. For non-React libraries see
 * {@link renderObservablePlot} and {@link renderECharts}.
 */
export function Chart({ width, height, children, className, style }: ChartProps): ReactElement {
  const markup = renderToStaticMarkup(children as ReactElement);
  const svgStart = markup.indexOf('<svg');
  const svgEnd = markup.lastIndexOf('</svg>');
  const svg =
    svgStart === -1 || svgEnd === -1 ? markup : markup.slice(svgStart, svgEnd + '</svg>'.length);
  const props: Record<string, unknown> = { src: svg, style: { ...style, width, height } };
  if (className) props.className = className;
  return <Svg {...props} />;
}

/** SSRs a React element and returns the inner `<svg>…</svg>` substring. */
export function renderToSvgString(node: ReactElement): string {
  const markup = renderToStaticMarkup(node);
  const start = markup.indexOf('<svg');
  const end = markup.lastIndexOf('</svg>');
  if (start === -1 || end === -1) return markup;
  return markup.slice(start, end + '</svg>'.length);
}

/** Extracts the SVG markup from an Observable Plot output node (`SVGSVGElement` or `<figure>` wrapper). */
export function renderObservablePlot(
  plot: { outerHTML: string } | { querySelector: (s: string) => { outerHTML: string } | null },
): string {
  const direct = (plot as { outerHTML?: string }).outerHTML;
  if (typeof direct === 'string' && direct.trim().startsWith('<svg')) return direct;
  if ('querySelector' in plot) {
    const found = plot.querySelector('svg');
    if (found) return found.outerHTML;
  }
  return typeof direct === 'string' ? direct : '';
}

/**
 * Normalizes the output of ECharts SSR (`echarts.init(null, null, { renderer:
 * 'svg', ssr: true }).renderToSVGString()`) by stripping any surrounding
 * markup so the result is exactly one `<svg>` root.
 */
export function renderECharts(svgString: string): string {
  const start = svgString.indexOf('<svg');
  const end = svgString.lastIndexOf('</svg>');
  if (start === -1 || end === -1) return svgString;
  return svgString.slice(start, end + '</svg>'.length);
}
