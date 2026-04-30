import type { ReactNode } from 'react';
import React from 'react';

export interface FormProps {
  name?: string;
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function Form({ children, ...rest }: FormProps): React.ReactElement {
  return React.createElement('imprint-form', rest as Record<string, unknown>, children);
}
