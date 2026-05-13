import React from 'react';

/**
 * Placeholder for the total page count — replaced at write time. Renders
 * `inline-flex` so `<span>of <TotalPages /></span>` stays on one line;
 * a plain `view` defaults to block and breaks inline flow.
 */
export function TotalPages(): React.ReactElement {
  return React.createElement('imprint-view', {
    __totalPages: true,
    style: { display: 'inline-flex' },
  } as Record<string, unknown>);
}
