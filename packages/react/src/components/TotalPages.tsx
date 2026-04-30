import React from 'react';

/**
 * Renders a placeholder that the PDF writer replaces with the total page
 * count at write time.
 */
export function TotalPages(): React.ReactElement {
  return React.createElement('imprint-view', { __totalPages: true } as Record<string, unknown>);
}
