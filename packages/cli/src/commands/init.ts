import { existsSync, writeFileSync } from 'node:fs';

export async function runInit(options: { ts: boolean }) {
  const configFile = options.ts ? 'imprint.config.ts' : 'imprint.config.js';

  if (existsSync(configFile)) {
    console.log(`${configFile} already exists, skipping.`);
    return;
  }

  // Sensible defaults handle the rest:
  //   - outDir: 'out'
  //   - tailwind.stylesheet: auto-detected from src/app.css, src/globals.css, …
  const content = options.ts
    ? `import { defineConfig } from '@imprint/core/config'

export default defineConfig({
  fonts: [
    // { family: 'Inter', src: './public/fonts/Inter.woff2' },
  ],
})
`
    : `const { defineConfig } = require('@imprint/core/config')

module.exports = defineConfig({
  fonts: [
    // { family: 'Inter', src: './public/fonts/Inter.woff2' },
  ],
})
`;

  writeFileSync(configFile, content, 'utf-8');
  console.log(`Created ${configFile}`);
  console.log('Run `npx imprint render src/templates/MyTemplate.tsx` to get started.');
}
