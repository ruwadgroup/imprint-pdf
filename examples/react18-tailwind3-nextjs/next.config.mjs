import { withImprint } from '@imprint-pdf/next/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withImprint({
  // tailwind.config is explicit so the v3 dispatch path lights up
  // regardless of detection heuristics. tailwind.stylesheet would force v4.
  tailwind: { config: './tailwind.config.ts' },
})(nextConfig);
