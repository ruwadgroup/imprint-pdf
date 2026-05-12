import { defineConfig } from '@imprint-pdf/core/config';

// Tailwind v3 path: point at the JS config the create-next-app CLI scaffolded.
// imprint-pdf detects the v3 config and runs the classic PostCSS plugin.
export default defineConfig({
  tailwind: {
    config: './tailwind.config.ts',
  },
});
