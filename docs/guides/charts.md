# Charts and SVG

PDFs are vector-native. Rasterising charts as PNG screenshots and embedding them
is lossy, blurry at high zoom, and wastes bytes. imprint-pdf converts chart SVG
output directly to PDF content stream operators — perfectly crisp at any zoom
level, printable at any resolution.

## `<Chart>`

The `<Chart>` component wraps any charting library that produces SVG and
converts the output to PDF vectors.

```tsx
import { Chart } from '@imprint-pdf/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const data = [
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 5800 },
  { month: 'Mar', revenue: 3900 },
];

export function RevenueChart() {
  return (
    <Chart className="w-full h-64">
      <LineChart width={600} height={250} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3B82F6"
          strokeWidth={2}
        />
      </LineChart>
    </Chart>
  );
}
```

## Supported libraries

| Library         | Adapter                        | Notes                                                  |
| --------------- | ------------------------------ | ------------------------------------------------------ |
| Recharts        | Built-in                       | Full support; call `renderToSVG` internally.           |
| Visx            | Built-in                       | SVG-first; excellent for custom shapes.                |
| ECharts         | Built-in (`renderToSVGString`) | Enable SVG renderer in ECharts config.                 |
| Observable Plot | Built-in                       | Uses `plot.plot({ ...opts, document: svgDoc })`.       |
| D3              | Manual `<Svg src={…} />`       | Render D3 to a detached SVG, pass the string.          |
| Chart.js        | Via `toBase64Image` workaround | JPEG/PNG fallback; vector not available from Chart.js. |

## SVG directly

For non-chart SVG content, use `<Svg>`:

```tsx
<Svg
  src={`
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#3B82F6" />
  </svg>
`}
  className="h-32 w-32"
/>
```

Or import an SVG file (with the Vite/Next plugin):

```tsx
import logoSvg from './logo.svg?raw';

<Svg src={logoSvg} className="h-16 w-auto" />;
```

## Vector pipeline internals

- Linear and radial gradients → PDF Type 2/3 shadings.
- SVG masks → PDF soft masks (smask).
- Clip paths → PDF clipping paths in the content stream.
- Complex filters (blur, drop-shadow, etc.) → rasterized via resvg-wasm as a
  fallback; a warning is emitted in strict mode.
- Text inside SVG → converted to glyph paths so no font embedding is needed for
  chart labels.

## CMYK charts

With `@imprint-pdf/print`, colors in charts that use Tailwind's OKLCH values are
converted to CMYK automatically via lcms2. For explicit CMYK in chart code, use
the CSS `imprint:cmyk-[c_m_y_k]` custom property or pass pre-computed CMYK
values to your chart color props.
