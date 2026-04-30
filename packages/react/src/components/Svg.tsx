import type { ReactNode } from 'react';
import React from 'react';

export interface SvgProps {
  /** URL or inline SVG source. */
  src?: string;
  className?: string;
  style?: Record<string, unknown>;
  /** Inline SVG child elements (alternative to `src`). */
  children?: ReactNode;
}

export function Svg({ children, ...rest }: SvgProps): React.ReactElement {
  return React.createElement('imprint-svg', rest as Record<string, unknown>, children);
}
