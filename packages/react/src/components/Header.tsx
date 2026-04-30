import type { ReactNode } from 'react';
import React from 'react';

export interface HeaderProps {
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

/**
 * Running page header — rendered once and repeated across all pages by the
 * PDF writer.
 */
export function Header({ children, ...rest }: HeaderProps): React.ReactElement {
  return React.createElement('imprint-header', rest as Record<string, unknown>, children);
}
