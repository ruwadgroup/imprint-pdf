import { byId } from '@imprint-pdf/fixtures';
import { pdf } from '@imprint-pdf/react';
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => pdf(byId('invoice')!.render());
