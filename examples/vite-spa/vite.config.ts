import { imprint } from '@imprint-pdf/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // `imprint()` scans the app's source for the PDF's Tailwind classes and
  // compiles them against ./src/app.css (the project theme) at build time,
  // exposed as `virtual:imprint-classes`. The browser renders with the real
  // theme and never bundles the Tailwind compiler.
  plugins: [imprint({ stylesheet: 'src/app.css' }), react()],
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
