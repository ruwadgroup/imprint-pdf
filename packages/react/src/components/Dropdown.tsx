import React from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  name: string;
  options: DropdownOption[];
  defaultValue?: string;
  className?: string;
  style?: Record<string, unknown>;
}

export function Dropdown({ ...rest }: DropdownProps): React.ReactElement {
  return React.createElement('imprint-dropdown', rest as Record<string, unknown>);
}
