import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    server: 'src/server.ts',
    standalone: 'src/standalone.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // `@imprint-pdf/tailwind` is a private workspace package — inline its code
  // into the dist so consumers don't need to install it. Without this it would
  // be left as a runtime import that fails on `npm install @imprint-pdf/react`.
  noExternal: ['@imprint-pdf/tailwind'],
});
