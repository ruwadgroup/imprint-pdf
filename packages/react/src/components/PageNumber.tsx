import React from 'react';

/**
 * Renders a placeholder that the PDF writer replaces with the current page
 * number at write time.
 */
export function PageNumber(): React.ReactElement {
  return React.createElement('imprint-view', { __pageNumber: true } as Record<string, unknown>);
}
