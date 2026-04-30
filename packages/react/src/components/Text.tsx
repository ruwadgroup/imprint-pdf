import type { ReactNode } from 'react';
import React from 'react';

export interface TextProps {
  /** Optional hyphenation strategy — passed through as a prop to the PDF writer. */
  hyphenation?: 'none' | 'auto';
  /** Optional line-breaking strategy. */
  lineBreaking?: 'default' | 'knuth-plass';
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function Text({ children, ...rest }: TextProps): React.ReactElement {
  return React.createElement('imprint-text', rest as Record<string, unknown>, children);
}
