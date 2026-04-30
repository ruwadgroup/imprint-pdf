import type { ReactNode } from 'react';
import React from 'react';

export interface FooterProps {
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

/**
 * Running page footer — rendered once and repeated across all pages by the
 * PDF writer.
 */
export function Footer({ children, ...rest }: FooterProps): React.ReactElement {
  return React.createElement('imprint-footer', rest as Record<string, unknown>, children);
}
