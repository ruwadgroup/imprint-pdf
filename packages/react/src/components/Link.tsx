import type { ReactNode } from 'react';
import React from 'react';

export interface LinkProps {
  /** The URL this link points to. */
  href: string;
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function Link({ children, ...rest }: LinkProps): React.ReactElement {
  return React.createElement('imprint-link', rest as Record<string, unknown>, children);
}
