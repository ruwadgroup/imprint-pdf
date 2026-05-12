import React from 'react';

/**
 * Renders a placeholder that the PDF writer replaces with the current page
 * number at write time. Lays out as `inline-flex` so siblings like
 * `<span>Page <PageNumber /></span>` render on a single line — a plain
 * `view` would default to a block and break inline flow.
 */
export function PageNumber(): React.ReactElement {
  return React.createElement('imprint-view', {
    __pageNumber: true,
    style: { display: 'inline-flex' },
  } as Record<string, unknown>);
}
