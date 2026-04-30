import type { ReactNode } from 'react';
import React from 'react';

export interface ButtonProps {
  name: string;
  /** PDF action to perform when the button is activated (e.g. submit-form URL). */
  action?: string;
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function Button({ children, ...rest }: ButtonProps): React.ReactElement {
  return React.createElement('imprint-button', rest as Record<string, unknown>, children);
}
