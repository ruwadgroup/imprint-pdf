import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';

export default defineEventHandler(() => pdf(byId('invoice')!.render()));
