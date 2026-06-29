import type { NextApiRequest, NextApiResponse } from 'next'
import { pdf } from '@imprint-pdf/next'
import { byId } from '@imprint-pdf/fixtures'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const bytes = await pdf(byId('invoice')!.render(), { as: 'bytes' })
  res.setHeader('content-type', 'application/pdf')
  res.setHeader('content-disposition', 'inline; filename="invoice.pdf"')
  res.send(Buffer.from(bytes))
}
