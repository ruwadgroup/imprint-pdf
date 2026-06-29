# Research: POC + bug trace

## Bug trace

`packages/react/dist/index.js` (the `import` target of `@imprint-pdf/react`)
starts with:

```js
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { ... } from '@imprint-pdf/core';            // node:fs/promises, module
import { resolveStylesWithVariants } from '@imprint-pdf/core/browser';
```

`packages/react/package.json` `exports["."]` had no `browser` key, so browser
bundlers resolve this node entry. Vite build failure:

```
"existsSync" is not exported by "__vite-browser-external",
  imported by ".../packages/react/dist/index.js"
```

## Rejected workaround: the `"browser"` export condition

The first idea was a `"browser": "./dist/standalone.js"` export condition
routing bundlers to the WASM build. The POC below shows it _works_, but it was
rejected as a band-aid: it keeps two divergent builds, leaves the default entry
node-bound, and does nothing for project-Tailwind-in-the-browser. The PRD
instead makes the default entry isomorphic by construction. The POC is kept only
as evidence that the standalone build is browser-clean.

## POC (passed, reverted)

1. Added `"browser": "./dist/standalone.js"` to `react` `exports["."]` (before
   `import`).
2. Changed `examples/vite-spa/src/main.tsx` to
   `import { pdf } from '@imprint-pdf/react'` (bare main entry, as a normal user
   writes it).
3. `pnpm exec vite build` → `✓ 236 modules transformed; ✓ built in 1.7s`.

Without step 1, the same build fails on `existsSync`. Confirms the `browser`
condition routes bundlers to the WASM build. `dist/standalone.js` has zero node
built-ins at module top (verified).

## Follow-on requirement (maintainer): Tailwind config in the browser

The node entry loads the project's Tailwind config from disk (the `fs`/
`createRequire` that breaks browsers). The browser/standalone build therefore
can't pick up a project's custom Tailwind theme/tokens/plugins from disk.
Browser consumers need a way to **supply** their Tailwind config/theme
explicitly (they can `import twConfig from './tailwind.config'` in a bundled app
and pass it).

This is **Unit 2** of this PRD - the in-memory Tailwind compile path. The
findings:

- Node path (`packages/tailwind/src/tw-runner.ts`): runs the real Tailwind
  compiler loaded from disk against `projectRoot` / `options.stylesheet`. Needs
  fs - the thing that breaks browsers.
- Browser path today (`packages/tailwind/src/runtime.ts`
  `resolveBrowserClassMap`): creates a DOM `<div>`, applies each class, reads
  `getComputedStyle`. So it picks up the project theme ONLY for classes the
  page's loaded Tailwind CSS still contains - Tailwind purges unused classes, so
  classes used only in the PDF don't resolve. Also needs `document` (no web
  worker / SSR).
- `packages/react/src/render-standalone.ts` THROWS if `options.tailwind` is set
  outside a DOM: "Runtime Tailwind compilation is only available in the Node
  entry." So there is no in-browser compile path today.
- `RenderOptions.tailwind` already has `stylesheet?: string`, `config?`,
  `classMap?`, `safelist?` - hooks a browser-compile path could reuse.
