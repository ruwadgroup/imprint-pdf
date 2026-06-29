import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';

export default {
  fetch: () => pdf(byId('invoice')!.render()),
} satisfies ExportedHandler;
