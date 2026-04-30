import React from 'react';

export interface CheckboxProps {
  name: string;
  required?: boolean;
  defaultChecked?: boolean;
  className?: string;
  style?: Record<string, unknown>;
}

export function Checkbox({ ...rest }: CheckboxProps): React.ReactElement {
  return React.createElement('imprint-checkbox', rest as Record<string, unknown>);
}
