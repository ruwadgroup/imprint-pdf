import React from 'react';

/**
 * Renders a placeholder that the PDF writer replaces with the total page
 * count at write time. Lays out as `inline-flex` so siblings like
 * `<span>of <TotalPages /></span>` render on a single line — a plain
 * `view` would default to a block and break inline flow.
 */
export function TotalPages(): React.ReactElement {
  return React.createElement('imprint-view', {
    __totalPages: true,
    style: { display: 'inline-flex' },
  } as Record<string, unknown>);
}
