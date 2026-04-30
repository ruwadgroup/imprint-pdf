import { existsSync, writeFileSync } from 'node:fs';

export async function runInit(options: { ts: boolean }) {
  const configFile = options.ts ? 'imprint.config.ts' : 'imprint.config.js';

  if (existsSync(configFile)) {
    console.log(`${configFile} already exists, skipping.`);
    return;
  }

  const content = options.ts
    ? `import { defineConfig } from '@imprint/core/config'

export default defineConfig({
  fonts: [
    // { family: 'Inter', src: './public/fonts/Inter.woff2' },
  ],
  tailwind: {
    config: './tailwind.config.ts',
  },
  outDir: 'out',
})
`
    : `const { defineConfig } = require('@imprint/core/config')

module.exports = defineConfig({
  fonts: [
    // { family: 'Inter', src: './public/fonts/Inter.woff2' },
  ],
  tailwind: {
    config: './tailwind.config.js',
  },
  outDir: 'out',
})
`;

  writeFileSync(configFile, content, 'utf-8');
  console.log(`Created ${configFile}`);
  console.log('Run `npx imprint render src/templates/MyTemplate.tsx` to get started.');
}
