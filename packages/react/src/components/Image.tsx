import React from 'react';

export interface ImageProps {
  /** URL or data-URI of the image to embed. */
  src: string;
  /** Accessible description (stored as alt prop). */
  alt?: string;
  /** How the image should be fitted within its container. */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  className?: string;
  style?: Record<string, unknown>;
}

export function Image({ ...rest }: ImageProps): React.ReactElement {
  return React.createElement('imprint-image', rest as Record<string, unknown>);
}
