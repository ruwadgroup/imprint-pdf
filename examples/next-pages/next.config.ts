import type { NextConfig } from 'next'
import { withImprint } from '@imprint-pdf/next/plugin'

const config: NextConfig = {
  // @imprint-pdf/fixtures ships raw TS via its exports map; let Next compile it.
  transpilePackages: ['@imprint-pdf/fixtures'],
}

export default withImprint()(config)
