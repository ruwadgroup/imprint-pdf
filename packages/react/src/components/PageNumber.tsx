import React from 'react';

/**
 * Placeholder for the current page number — replaced at write time. Renders
 * `inline-flex` so `<span>Page <PageNumber /></span>` stays on one line;
 * a plain `view` defaults to block and breaks inline flow.
 */
export function PageNumber(): React.ReactElement {
  return React.createElement('imprint-view', {
    __pageNumber: true,
    style: { display: 'inline-flex' },
  } as Record<string, unknown>);
}
