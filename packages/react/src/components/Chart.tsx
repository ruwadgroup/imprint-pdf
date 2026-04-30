import type { ReactNode } from 'react';
import React from 'react';

export interface ChartProps {
  width: number;
  height: number;
  className?: string;
  style?: Record<string, unknown>;
  /** SVG children that define the chart visuals. */
  children?: ReactNode;
}

export function Chart({ children, ...rest }: ChartProps): React.ReactElement {
  return React.createElement('imprint-chart', rest as Record<string, unknown>, children);
}
