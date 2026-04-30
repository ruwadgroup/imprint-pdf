import React from 'react';

export type TextFieldType = 'text' | 'password' | 'email' | 'number' | 'date' | 'tel';

export interface TextFieldProps {
  name: string;
  type?: TextFieldType;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  style?: Record<string, unknown>;
}

export function TextField({ ...rest }: TextFieldProps): React.ReactElement {
  return React.createElement('imprint-textfield', rest as Record<string, unknown>);
}
