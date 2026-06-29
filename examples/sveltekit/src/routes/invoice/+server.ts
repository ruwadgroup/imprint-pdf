import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';

export const GET = () => pdf(byId('invoice')!.render());
