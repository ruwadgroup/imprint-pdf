import { defineConfig } from '@imprint-pdf/core/config';
import { googleFont } from '@imprint-pdf/fonts/google';

// next/font-style ergonomics. `googleFont` resolves to Fontsource jsdelivr
// URLs at render time — no manual paths, no per-weight repetition.
export default defineConfig({
  fonts: [...googleFont('Inter', { weight: ['400', '500', '700'] })],
  tailwind: {
    config: './tailwind.config.ts',
  },
});
