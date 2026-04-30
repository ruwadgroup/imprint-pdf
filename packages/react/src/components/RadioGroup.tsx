import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  defaultValue?: string;
  className?: string;
  style?: Record<string, unknown>;
}

export function RadioGroup({ ...rest }: RadioGroupProps): React.ReactElement {
  return React.createElement('imprint-radiogroup', rest as Record<string, unknown>);
}
