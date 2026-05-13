import type { ReactNode } from 'react';
import React from 'react';

export interface WatermarkProps {
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

/** Watermark — drawn behind page content on every page. */
export function Watermark({ children, ...rest }: WatermarkProps): React.ReactElement {
  return React.createElement('imprint-watermark', rest as Record<string, unknown>, children);
}
