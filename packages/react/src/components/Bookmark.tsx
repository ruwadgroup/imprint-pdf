import type { ReactNode } from 'react';
import React from 'react';

export interface BookmarkProps {
  /** The text label shown in the PDF outline panel. */
  title: string;
  /** Heading level (1–6); controls indentation in the PDF outline. Defaults to 1. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function Bookmark({ children, ...rest }: BookmarkProps): React.ReactElement {
  return React.createElement('imprint-bookmark', rest as Record<string, unknown>, children);
}
