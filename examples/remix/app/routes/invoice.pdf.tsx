import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import type { Route } from './+types/invoice.pdf';

// Resource route: a loader-only module (no default component) whose return
// value is sent verbatim. `pdf()` already returns a Response with the right
// Content-Type / Content-Disposition headers.
export function loader(_: Route.LoaderArgs) {
  return pdf(byId('invoice')!.render());
}
