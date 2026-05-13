// Ambient module declarations for the npm-aliased `react-reconciler` copies.
// Both resolve to the same `react-reconciler` package on disk (via the `npm:`
// alias in package.json), so they share the upstream `@types/react-reconciler`
// shape.
declare module 'react-reconciler-18' {
  import * as ReactReconciler from 'react-reconciler';
  export = ReactReconciler;
}

declare module 'react-reconciler-19' {
  import * as ReactReconciler from 'react-reconciler';
  export = ReactReconciler;
}

declare module 'react-reconciler-18/constants.js' {
  export const DefaultEventPriority: number;
  export const LegacyRoot: number;
}

declare module 'react-reconciler-19/constants.js' {
  export const DefaultEventPriority: number;
  export const LegacyRoot: number;
}
