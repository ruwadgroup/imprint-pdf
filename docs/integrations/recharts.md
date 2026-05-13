# Integration — Recharts

Recharts is the most popular React charting library. imprint-pdf renders
Recharts charts as PDF vector graphics, not rasterized screenshots.

## Install

```bash
pnpm add recharts
```

## Setup

Wrap your Recharts tree in `<Chart>`. No extra config — Recharts components are
detected and rendered to SVG server-side.

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

- **`<ResponsiveContainer>`** doesn't work — there's no DOM to measure. Pass
  explicit `width` / `height` to the chart root.
- **`<Tooltip>`** renders as a static element — hover does nothing. Remove it
  for cleaner output.
- **Animations** are disabled automatically in the SSR context.
- **`<Legend>`** renders as a static positioned element — style it with
  `className` for print.
- **Custom shapes** via the `shape` prop work as long as they emit SVG.
