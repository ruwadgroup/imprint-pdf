import React from 'react';

export interface SignatureProps {
  name: string;
  certificate?: string;
  privateKey?: string;
  className?: string;
  style?: Record<string, unknown>;
}

export function Signature({ ...rest }: SignatureProps): React.ReactElement {
  return React.createElement('imprint-signature', rest as Record<string, unknown>);
}
