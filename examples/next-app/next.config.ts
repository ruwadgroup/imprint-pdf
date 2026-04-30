import type { NextConfig } from 'next'

const config: NextConfig = {
  serverExternalPackages: ['@imprint/core', '@imprint/react', '@imprint/next', 'pdf-lib', 'fontkit'],
  webpack(cfg) {
    cfg.experiments = { ...cfg.experiments, asyncWebAssembly: true, layers: true }
    return cfg
  },
}

export default config
