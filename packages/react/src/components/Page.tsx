import type { ReactNode } from 'react';
import React from 'react';

export type PageSize =
  | 'A0'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'B4'
  | 'B5'
  | 'B6'
  | 'Letter'
  | 'Legal'
  | 'Tabloid'
  | 'Ledger'
  | 'Executive'
  | 'DL'
  | 'C5'
  | [number, number];
export type SizeUnit = 'pt' | 'mm' | 'cm' | 'in' | 'px';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageProps {
  size?: PageSize;
  sizeUnit?: SizeUnit;
  orientation?: PageOrientation;
  bleed?: number;
  marks?: boolean;
  className?: string;
  style?: Record<string, unknown>;
  children?: ReactNode;
}

export function Page({ children, ...rest }: PageProps): React.ReactElement {
  return React.createElement('imprint-page', rest as Record<string, unknown>, children);
}
