# Changelog

All notable changes are documented here. See [Conventional Commits](https://www.conventionalcommits.org) and [Changesets](../../.changeset) for the release workflow.

## 1.0.0-alpha.3

### Minor

- **Unified `pdf()` entry point.** `pdf(element, options?)` is the single recommended way to render a PDF. It picks output shape via `options.as` — `'response'` (default, returns a `Response` with PDF headers), `'bytes'` (`Uint8Array`), or `'stream'` (`ReadableStream<Uint8Array>`) — and auto-loads `imprint.config.ts` from the project root. Overloads narrow the return type by the literal value of `as`, so no manual casts. `renderToBuffer` and `renderToStream` remain for power users.
- **Zero-install React 18 + 19 support.** `@imprint-pdf/react` now bundles both `react-reconciler@^0.29` (R18) and `^0.33` (R19) under aliased package names and picks the matching one at module load via `React.version`. Consumers install neither directly — a single `pnpm add @imprint-pdf/react react@^18` (or `react@^19`) works. The host-config is built dynamically: 16 R19-only fields (transition/priority/suspense/form/paint hooks) are only included on R19; `commitUpdate` reads `newProps` from the last arg either way; `createContainer` and `updateContainerSync` are shimmed by arity / feature-detection. `react` peer broadens to `>=18.2.0 <20`.

### Patch

- **`<PageNumber>` / `<TotalPages>` resolve correctly.** The components now default to `display: 'inline-flex'` so they don't break inline flow when used as siblings.
