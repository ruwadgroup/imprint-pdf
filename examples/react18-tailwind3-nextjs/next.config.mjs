import { withImprint } from '@imprint-pdf/next/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force the deployment-shape build so we catch nft tracing bugs in CI / smoke
  // tests, not in production. `.next/standalone/` is what Vercel and most
  // self-hosted deployments actually ship.
  output: 'standalone',
};

export default withImprint({
  tailwind: { config: './tailwind.config.ts' },
})(nextConfig);
