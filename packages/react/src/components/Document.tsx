import type { ReactNode } from 'react';
import React from 'react';
import type { PageOrientation, PageSize, SizeUnit } from './Page.js';

export interface PageDefaults {
  size?: PageSize;
  sizeUnit?: SizeUnit;
  orientation?: PageOrientation;
}

export interface DocumentProps {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  lang?: string;
  intent?: string;
  outputIntent?: string;
  embeds?: Array<{ name: string; data: Uint8Array; mimeType: string }>;
  /** Default page size/orientation for all pages that don't specify their own. */
  pageDefaults?: PageDefaults;
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function Document({ children, ...rest }: DocumentProps): React.ReactElement {
  return React.createElement('imprint-document', rest as Record<string, unknown>, children);
}
