# Integration — Recharts

Recharts is the most popular React charting library. imprint-pdf renders
Recharts charts as PDF vector graphics — not rasterized screenshots.

## Install

```bash
pnpm add recharts
```

## Setup

Wrap your Recharts tree in `<Chart>`. No additional configuration needed —
imprint-pdf detects Recharts components and renders them to SVG server-side.

```tsx
import { Chart } from '@imprint-pdf/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export function TrendChart({ data }: { data: DataPoint[] }) {
  return (
    <Chart className="w-full h-56">
      <LineChart
        width={540}
        height={220}
        data={data}
        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E5E7EB"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          activeDot={false}
        />
      </LineChart>
    </Chart>
  );
}
```

## Supported chart types

All Recharts chart types that produce SVG output work:

- `LineChart`, `BarChart`, `AreaChart`, `ComposedChart`
- `PieChart`, `RadarChart`, `RadialBarChart`
- `ScatterChart`, `Treemap`, `Sankey`

## Notes

- **`<ResponsiveContainer>`** does not work in PDFs — there is no DOM to
  measure. Pass explicit `width` and `height` to the chart root element.
- **`<Tooltip>`** renders as a static element — hover interactivity has no
  effect. Remove it for cleaner output.
- **Animations** are disabled automatically in imprint-pdf's SSR context.
- **`<Legend>`** renders as a static positioned element — style it with
  `className` for print.
- **Custom shapes** via `shape` prop work as long as they produce SVG elements.
