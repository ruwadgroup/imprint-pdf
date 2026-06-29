import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react/standalone';

export const config = { runtime: 'edge' };

export default () => pdf(byId('invoice')!.render());
