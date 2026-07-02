# Contributing to imprint-pdf

Thanks for considering a contribution! This guide gets you from zero to a merged
PR.

## Prerequisites

- **Node** ≥ 20 (see `.nvmrc` — `nvm use`)
- **pnpm** ≥ 10 (pinned via `packageManager` in `package.json`)
- **Rust** ≥ 1.78 + `wasm-pack` (only required to rebuild the WASM modules;
  prebuilt artifacts ship in the repo)
- **Git** with `core.autocrlf` off (LF is enforced via `.gitattributes`)

## Setup

```bash
git clone https://github.com/tamimbinhakim/imprint-pdf.git
cd imprint
pnpm install
pnpm build
```

The build runs `tsup` for every TypeScript package and copies the prebuilt WASM
artifacts into each package's `dist/`. To rebuild WASM from source:

```bash
pnpm wasm:build
```

## Working on a package

```bash
pnpm dev                                # watch every package
pnpm --filter @imprint-pdf/core dev         # watch one
pnpm --filter @imprint-pdf/core test        # test one
```

Examples are wired via `workspace:*`:

```bash
pnpm --filter @imprint-pdf/example-next-app dev
pnpm --filter @imprint-pdf/example-vite-react dev
pnpm --filter @imprint-pdf/example-cloudflare-worker dev
pnpm --filter @imprint-pdf/example-bun-server dev
```

## Code style

- **Formatter & linter** — [Biome](https://biomejs.dev/) for `.ts` / `.tsx` /
  `.json`. Prettier handles `.md` / `.yml` / `.yaml`.
- **TypeScript** — strict mode, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`. No `any` without a `// biome-ignore`
  justification.
- **Imports** — `useImportType` is enforced. Type-only imports use
  `import type`.
- **Comments** — default to none. Add only when _why_ is non-obvious. No
  multi-paragraph docstrings.

```bash
pnpm lint           # check
pnpm lint:fix       # auto-fix
pnpm format         # format everything
pnpm typecheck      # full project tsc
```

## Tests

[Vitest](https://vitest.dev) across the monorepo. Place tests next to source
(`*.test.ts`) or under `tests/`.

For PDF output, golden-file tests live under `packages/<pkg>/__fixtures__/`. The
runner compares the produced PDF against the golden using a tolerant byte-level
diff (object stream ordering is allowed to vary). To regenerate goldens:

```bash
pnpm test:goldens:update
```

For visual regressions, the suite renders each fixture to PNG via `pdfium-wasm`
and diffs against `__pixmaps__/`.

```bash
pnpm test               # watch
pnpm test:ci            # one-shot
pnpm test:visual        # visual regression
```

A PR that introduces new behavior includes tests.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), enforced via the
`commit-msg` hook.

```
<type>(<scope>): <subject>

<body>

<footer>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

Allowed scopes: `core`, `react`, `tailwind`, `cli`, `next`, `vite`, `print`,
`sign`, `ua`, `eslint-plugin`, `examples`, `docs`, `wasm`, `ci`, `deps`,
`release`.

Examples:

```
feat(react): add <Footer> component with running page counter
fix(tailwind): preserve OKLCH colors through Lightning CSS roundtrip
docs(print): clarify PDF/X-4 output intent setup
```

## Changesets

Any change to a published package needs a changeset.

```bash
pnpm changeset
```

Pick the affected packages, the bump (`patch` / `minor` / `major`), and write a
short summary aimed at end users. Commit the generated `.md`.

Skip changesets for: docs-only changes, internal refactors that don't touch
public API, CI / dev-tooling tweaks.

## Pull request flow

1. Fork & branch from `main`. Branch naming: `feat/<scope>/<short-desc>`,
   `fix/<scope>/<short-desc>`.
2. Make your change. Add tests. Add a changeset.
3. `pnpm lint && pnpm typecheck && pnpm test:ci && pnpm build` — all green.
4. Open a PR against `main`. The template walks through the checklist.
5. CI runs lint, typecheck, tests on Node 20 + 22 across Linux / macOS /
   Windows, plus the visual regression suite.
6. A maintainer reviews. Approved → squash-merge.

## Releasing

Maintainers only. See [`.github/RELEASING.md`](RELEASING.md).

## Reporting bugs / requesting features

Use the issue templates. Provide a minimal reproduction (StackBlitz,
CodeSandbox, or a small repo) — issues without one get closed.

PDF bugs: please attach the PDF (or a redacted version), the source component,
and the imprint-pdf version. A `pnpm imprint validate <pdf>` report helps.

## Security

Don't open a public issue for vulnerabilities. See [`SECURITY.md`](SECURITY.md).

## Code of conduct

By participating you agree to the [Contributor Covenant](CODE_OF_CONDUCT.md).
