import type { NextConfig } from 'next'

const config: NextConfig = {
  // @imprint-pdf/fixtures ships raw TS via its exports map; let Next compile it.
  transpilePackages: ['@imprint-pdf/fixtures'],
  serverExternalPackages: ['@imprint-pdf/core', '@imprint-pdf/react', '@imprint-pdf/next', 'pdf-lib', 'fontkit'],
  webpack(cfg) {
    cfg.experiments = { ...cfg.experiments, asyncWebAssembly: true, layers: true }
    return cfg
  },
}

export default config
