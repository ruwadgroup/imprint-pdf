import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';

Deno.serve(() => pdf(byId('invoice')!.render()));
