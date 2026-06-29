# Architecture: isomorphic `@imprint-pdf/react`

## Goal

One `@imprint-pdf/react` entry that renders in **Node and the browser** from the
same import, with **no static `node:*` in the browser graph** and Tailwind that
uses the **project's real config in either runtime**. Delete the node/standalone
split (keep `/standalone` as a deprecated alias). This is the real fix, not a
`"browser"` export-condition routing trick.

## Root cause (traced at `3e76373`)

A bare browser build of `import { pdf } from '@imprint-pdf/react'` fails:

```
"existsSync" is not exported by "__vite-browser-external",
  imported by ".../packages/react/dist/index.js"
```

Why the node built-ins are in the _main_ bundle:

1. **`packages/react/tsup.config.ts` has
   `noExternal: ['@imprint-pdf/tailwind']`.** It inlines the entire Tailwind
   package into `dist/index.js`, including `packages/tailwind/src/tw-runner.ts`,
   which statically imports `fs`/`module` (`createRequire`)/`path` to find +
   read the project's Tailwind config/stylesheet **from disk**. `render.ts`
   imports tailwind _dynamically_ (`await import('@imprint-pdf/tailwind')`), but
   `noExternal` hoists its static node imports into the bundle anyway (11
   `createRequire`/`readFileSync`/ `existsSync` uses in `dist/index.js`).
2. **`@imprint-pdf/core`'s default entry** pulls node-only asset/font **disk
   loaders** (`fs/promises`), so even the WASM path drags them in.

The browser-safe pieces already exist but only as a _parallel_ build:
`@imprint-pdf/react/standalone` (`render-standalone.ts`),
`@imprint-pdf/core/browser` (`assets-browser.ts` / `browser.ts`).
`render-standalone.ts` even **throws** when `options.tailwind` is set outside a
DOM:

```
"Runtime Tailwind compilation is only available in the Node entry.
 Use @imprint-pdf/react on the server, render in a browser with Tailwind CSS
 loaded, or pass options.tailwind.classMap."
```

So in the browser today you only get Tailwind for classes the page's CSS still
contains (Tailwind purges the rest) - the second half of the problem.

## Target module graph

```
                       @imprint-pdf/react  (single entry)
                                |  static graph = browser-clean (no node:*)
        +-----------------------+---------------------------+
        v                       v                           v
  components/pdf()        render pipeline              tailwind compile
  (pure)                  (taffy-wasm + writer,        (Tailwind v4 compile,
                           already isomorphic)          in-memory stylesheet)
                                |                           |
                   runtime guard|  (typeof process/window)  |  in-memory by default
                                v                           v
                   --- node-only, LAZY (dynamic import) -----------------
                   - imprint.config.ts loader (fs)   - disk Tailwind resolve (fs/createRequire)
                   - disk font/asset readers (fs)    - native font subsetting
```

The base render path is the WASM pipeline (works everywhere). Everything that
touches disk is reached only through a **lazy, runtime-guarded dynamic import**,
so it never enters the static browser graph but is fully available on Node.

## The Tailwind seam (the load-bearing change)

Split `@imprint-pdf/tailwind` into two concerns:

| concern                                             | runtime    | how loaded                                                                                                                                                      |
| --------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **compile** `(classes, stylesheetText) -> classMap` | isomorphic | static OK - Tailwind v4 `compile()` with in-memory `loadStylesheet`/`loadModule` callbacks resolving `@import "tailwindcss"` to the bundled preset; **no `fs`** |
| **disk resolve** `(projectRoot) -> stylesheetText`  | node only  | lazy dynamic import; reads `imprint.config`/stylesheet from disk                                                                                                |

Then both render paths call the **same** compile with a stylesheet string:

```ts
// unified
const css =
  options.tailwind?.stylesheet ?? // caller-provided (browser or node)
  (await maybeLoadFromDisk(options)) ?? // node convenience, lazy, undefined in browser
  undefined;
const classMap = css
  ? await compile(classes, css)
  : await domOrDefault(classes, options);
```

- **Node**: unchanged DX - auto-loads the project stylesheet/config from disk
  (now lazily), compiles, renders. Existing goldens must not move.
- **Browser**: user passes their stylesheet (`import css from './app.css?raw'`)
  -> identical compile -> **every** class resolves with the real theme,
  independent of the page's purged CSS, and it works in workers (no `document`).
  The DOM resolver stays as a zero-config fallback; `classMap` stays as the
  prebuilt escape hatch. The "only available in the Node entry" throw is
  removed.

## Entry consolidation

- `@imprint-pdf/react` `"."` -> the isomorphic build (browser-clean static
  graph).
- `@imprint-pdf/react/standalone` -> **deprecated alias** that re-exports `"."`
  (kept so existing imports keep working; documented as no longer necessary).
- No `"browser"` export condition needed - one build serves all bundlers.
- `@imprint-pdf/core` `"."` -> browser-clean; node disk loaders lazy.
  `core/browser` kept as an alias if anything imports it.
- `packages/react/tsup.config.ts`: drop `noExternal: ['@imprint-pdf/tailwind']`
  (or replace with a build that keeps the node-disk tailwind in a separate lazy
  chunk) so node-only tailwind code never lands in the main bundle.

## Acceptance shape

- Built `packages/react/dist/index.js` has **zero** static
  `node:*`/`fs`/`module`/ `path` imports (regression test reads the artifact).
- A browser bundler builds a bare `import { pdf } from '@imprint-pdf/react'`
  with no externalization errors.
- Same document + same in-memory Tailwind stylesheet renders to
  **byte-identical** output in Node and in a browser-like (no-`document`)
  context.
- All existing Node e2e goldens/visual snapshots are unchanged (node parity).
