import type { ReactNode } from 'react';
import React from 'react';

export interface ViewProps {
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function View({ children, ...rest }: ViewProps): React.ReactElement {
  return React.createElement('imprint-view', rest as Record<string, unknown>, children);
}
