# Cookbook — Vector charts

Embedding charts from Recharts, Visx, and D3 as PDF vector graphics.

## Recharts

Wrap your Recharts tree in `<Chart>`. Imprint renders it to SVG server-side
and converts the output to PDF vector operators.

```tsx
import { Chart } from '@imprint/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const data = [
  { quarter: 'Q1', revenue: 4.2, expenses: 2.8 },
  { quarter: 'Q2', revenue: 5.8, expenses: 3.1 },
  { quarter: 'Q3', revenue: 6.1, expenses: 3.4 },
  { quarter: 'Q4', revenue: 7.4, expenses: 3.9 },
];

export function RevenueChart() {
  return (
    <Chart className="w-full h-56">
      <BarChart width={560} height={220} data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} unit="M" />
        <Bar dataKey="revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
      </BarChart>
    </Chart>
  );
}
```

Note: `<Tooltip>` and `<Legend>` are rendered as static elements in PDFs —
hover interactivity has no effect. Remove them for cleaner output or style
them for static display.

## Visx

```tsx
import { Chart } from '@imprint/react';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';

export function LineChart({ data }: { data: Point[] }) {
  const xScale = scaleLinear({ domain: [0, data.length], range: [0, 480] });
  const yScale = scaleLinear({ domain: [0, 100], range: [180, 0] });

  return (
    <Chart className="w-full h-48">
      <svg width={520} height={200}>
        <LinePath
          data={data}
          x={(d, i) => xScale(i)}
          y={d => yScale(d.value)}
          stroke="#3B82F6"
          strokeWidth={2}
        />
        <AxisBottom top={180} scale={xScale} numTicks={5} />
        <AxisLeft scale={yScale} numTicks={5} />
      </svg>
    </Chart>
  );
}
```

## D3 (manual SVG → `<Svg>`)

D3 doesn't have a server-side "render to SVG string" API out of the box.
Use a detached SVG document with `jsdom` (Node) or pass the SVG string manually:

```ts
import * as d3 from 'd3';
import { JSDOM } from 'jsdom';

function renderD3ToSvg(data: number[]): string {
  const dom = new JSDOM('<!DOCTYPE html><body></body>');
  const body = d3.select(dom.window.document.querySelector('body'));
  const svg = body.append('svg').attr('width', 500).attr('height', 200);

  const line = d3.line<number>()
    .x((_, i) => i * 50)
    .y(d => 200 - d * 2);

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#3B82F6')
    .attr('stroke-width', 2)
    .attr('d', line);

  return dom.window.document.querySelector('svg')!.outerHTML;
}
```

```tsx
<Svg src={renderD3ToSvg(data)} className="w-full h-48" />
```

## What gets vectorized

| SVG feature               | Treatment                             |
| ------------------------- | ------------------------------------- |
| `<path>`, `<rect>`, `<circle>` | → PDF path operators             |
| Linear / radial gradients | → PDF Type 2/3 shadings               |
| Clip paths                | → PDF clipping paths                  |
| SVG masks                 | → PDF soft masks (smask)              |
| CSS filters (blur, etc.)  | → rasterized via resvg-wasm (fallback)|
| `<text>` elements         | → converted to glyph paths            |
