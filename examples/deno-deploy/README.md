# example - deno-deploy

Deno (Deno Deploy) handler that renders the `invoice` fixture and returns the
standalone `pdf()` `Response` straight out of `Deno.serve`.

## What's shown

The Category D glue: pull a pre-built document from `@imprint-pdf/fixtures` and
return the `Response` from `@imprint-pdf/react/standalone`'s `pdf()` directly
from `Deno.serve`. Deno's HTTP handler contract is the Web `Response`, so there
is no adapter code.

```ts
Deno.serve(() => pdf(byId('invoice')!.render()));
```

## Run

```bash
pnpm --filter @imprint-pdf/example-deno-deploy dev
# → http://localhost:8000/  (deno run --allow-net main.ts)
```

## Module resolution

`deno.json` maps the bare specifiers for the real Deno runtime. The imprint
workspace packages are `private` (`workspace:*`, never published to npm), so the
`npm:@imprint-pdf/*` entries resolve through the pnpm-linked `node_modules`
(`"nodeModulesDir": "auto"`) rather than the npm registry. `react` resolves the
same way. On a published setup these would be plain registry `npm:` specifiers.

## DX notes

- **Category:** D (standalone WASM runtime, `Response` → reply)
- **Entry:** standalone - `import { pdf } from '@imprint-pdf/react/standalone'`
- **Glue:** 1 line - `Deno.serve` returns the `pdf()` `Response` verbatim.
- **Rating:** 🟡 - Runs on the Deno toolchain, but this is an npm/pnpm monorepo,
  so CI typechecks with plain `tsc --noEmit` instead of `deno check`. To keep
  that working without installing Deno, `deno.d.ts` declares a minimal ambient
  `const Deno` (just the `serve` signature this file uses) and the tsconfig sets
  `"types": []` so no `@types/node` / `@types/deno` globals collide with it.
  `Request`/`Response` come from the base tsconfig's `DOM` lib. The real `Deno`
  global supersedes the shim at runtime on Deno Deploy.
