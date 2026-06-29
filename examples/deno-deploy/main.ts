import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';

Deno.serve(() => pdf(byId('invoice')!.render()));
