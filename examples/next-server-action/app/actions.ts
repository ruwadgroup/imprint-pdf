'use server'

import { pdf } from '@imprint-pdf/next'
import { byId } from '@imprint-pdf/fixtures'

/** Render the fixture invoice and hand base64 bytes back to the client. */
export async function generateInvoice(): Promise<string> {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' })
  return Buffer.from(bytes).toString('base64')
}
