---
id: 001
title: Remove Python adapter docs/roadmap - make the project TS-only
slug: 001-remove-python
status: done
tags: [area:docs, type:refactor, theme:ts-only-cleanup]
priority: P2
severity: low
effort: S
risk:
  Leaving a dangling internal link or a stray "Python" mention that contradicts
  the new TS-only framing.
planned_at: { commit: 1ec7185, date: 2026-06-29 }
depends_on: []
mockups:
  interface: null
  architecture: null
research: null
---

# PRD 001: Remove Python adapter docs/roadmap - make the project TS-only

> **Executor instructions**: This PRD is portable - everything you need is in
> this file. Follow it top to bottom. Run every command in the AI verification
> checklist and confirm the expected result before reporting done. If a STOP
> condition fires, stop and report - do not improvise.

## Problem

imprint-pdf is a TypeScript PDF library, but the repo carries a sizeable
**aspirational Python adapter** documented as "Upcoming": a full `docs/python/`
section (overview, quick-start, authoring, integrations, architecture), a large
"v0.x - Python adapter" milestone in `ROADMAP.md`, and a "Python" section in the
docs index. None of it is implemented - there is **no Python code, no package,
no PyPI artifact, no build step, no CI, and no dependency** anywhere in the repo
(verified: `git ls-files` finds zero `.py`/`.impy`/`pyproject`/`requirements`
files).

It is pure documentation describing a future product surface. It sets an
external expectation (a whole second front end, `.impy` file format, Django /
FastAPI / Flask / Litestar adapters, manylinux/macOS/Windows wheels, a Rust LSP)
that the maintainer no longer wants to carry. The goal is to **make the project
unambiguously TS-only** and drop this documentation maintenance burden.

Removing it is low-risk because it is documentation only - nothing imports it,
nothing builds it, nothing tests it.

## Mockups

- **Interface** - `null`. This is documentation deletion; there is no
  user-visible application surface.
- **Architecture** - `null`. No code, schema, or module shape changes; only
  Markdown files are deleted/edited.

## Context (self-contained)

The Python footprint is **exactly three locations** (confirmed by a repo-wide
case-insensitive grep for
`python|pyodide|pip install|cpython|pypi|.impy|wasmtime-py|wasmer`, excluding
`node_modules`/`.git`/`dist`/lockfiles). There are **no** Python mentions in
`README.md`, `llms.txt`, `llms-full.txt`, `CITATION.cff`, `ARCHITECTURE.md`, or
any other doc - so those need no changes.

### 1. `docs/python/` - entire directory (delete)

Five files, all describing the unbuilt adapter:

```
docs/python/README.md
docs/python/architecture.md
docs/python/authoring.md
docs/python/integrations.md
docs/python/quick-start.md
```

The only inbound links to these files come from the two locations edited below;
once those sections are removed, nothing links into `docs/python/`.

### 2. `ROADMAP.md` - the "v0.x - Python adapter" milestone (delete the section)

Section spans **lines 126-220 inclusive**: from the heading
`## v0.x — Python adapter (Upcoming)` (line 126) through the last bullet of its
"Out of scope for v0.x Python" block (line 219) and the trailing blank line
(220). The next section, `## v1.x — Custom PDF writer (gated)`, begins at line
221 and must remain. Current surrounding text:

```
118  ## v1.0 — Stability & ergonomics
...
124        brochures
125
126  ## v0.x — Python adapter (Upcoming)          <- delete from here
...
219  - No React-in-Python — components are plain functions.
220                                                <- through this blank line
221  ## v1.x — Custom PDF writer (gated)          <- keep
```

End state: a single blank line between line 124's section and
`## v1.x — Custom PDF writer (gated)`.

### 3. `docs/README.md` - the "Python" index section (delete the section)

Section spans **lines 52-68**: from `## Python 🚧 Upcoming` (line 52) through
its last bullet (line 67) and the trailing blank line (68). It sits between
`## Frameworks` (ends line 50) and `## Integrations` (line 69). Current text:

```
50    - **[Bun](frameworks/bun.md)** — native WASM, Bun.serve
51
52    ## Python 🚧 Upcoming                        <- delete from here
...
67      to the IR and runs the WASM core in-process
68                                                 <- through this blank line
69    ## Integrations                             <- keep
```

End state: a single blank line between the `## Frameworks` list and
`## Integrations`.

### Verification commands this repo uses (from `package.json` / CI)

- Lint: `pnpm lint` (`biome check .`)
- Format check (covers Markdown via Prettier): `pnpm format:check`
- Typecheck: `pnpm typecheck`
- CI (`.github/workflows/ci.yml`) runs build, `pnpm typecheck`, `pnpm lint`,
  `pnpm test:ci`. There is **no** markdown link-checker in CI, so dangling links
  must be caught manually (see checklist).

## Non-goals

- **No broader package/cleanup work.** The original request also mentioned
  merging packages and removing other unnecessary files (e.g. `.local-tgz/`,
  committed `.DS_Store`, dual lint setups, example dedup). That is a
  **separate** follow-up PRD, not this one. Do not touch packages, configs,
  examples, or build tooling here.
- Do **not** edit `README.md`, `llms.txt`, `llms-full.txt`, or any file outside
  the three locations above - they contain no Python references.
- Do not renumber or rewrite other ROADMAP milestones; only excise the Python
  section.
- Do not regenerate `llms-full.txt`/`llms.txt`; they already contain zero Python
  content.

## Instructions

These three units are **independent** (distinct files) and may be done in any
order or fanned out, but the change is tiny enough to do directly.

1. **Delete `docs/python/`** - remove the entire directory and all five files
   (`README.md`, `architecture.md`, `authoring.md`, `integrations.md`,
   `quick-start.md`). Use `git rm -r docs/python`.

2. **Edit `ROADMAP.md`** - delete lines 126-220 (the
   `## v0.x — Python adapter (Upcoming)` section through its trailing blank
   line). Confirm `## v1.0 — Stability & ergonomics` is immediately followed by
   one blank line and then `## v1.x — Custom PDF writer (gated)`.

3. **Edit `docs/README.md`** - delete lines 52-68 (the `## Python 🚧 Upcoming`
   section through its trailing blank line). Confirm `## Frameworks`'s list is
   immediately followed by one blank line and then `## Integrations`.

4. **Sweep for stragglers** - run the grep in the checklist to confirm zero
   remaining Python references and zero links pointing at `docs/python/`.

## STOP conditions

- The grep in Context surfaces a Python reference **outside** the three
  documented locations (e.g. a new mention added since `planned_at` commit
  `1ec7185`) - stop and report; the scope assumption (docs-only, three places)
  no longer holds.
- Any `.py`/`.impy`/`pyproject`/`requirements*.txt`/`setup.py` file is found
  tracked by git - stop and report; there may be real Python code, which changes
  the nature of this task.
- The line numbers in `ROADMAP.md` / `docs/README.md` no longer match the quoted
  headings (file drifted) - re-locate by heading text, and if the section
  boundaries are ambiguous, stop and report.
- You find an inbound link to `docs/python/...` from a file **other** than the
  two edited here - stop and report rather than silently breaking or guessing.

## AI verification checklist (automatable)

- [ ] `docs/python/` no longer exists: `test ! -e docs/python && echo OK`
- [ ] No Python references remain anywhere (excluding tooling dirs):
      `grep -rniE '\bpython\b|pyodide|pip install|cpython|pypi|\.impy\b|wasmtime-py|wasmer' --include='*.md' --include='*.ts' --include='*.tsx' --include='*.json' --include='*.txt' --include='*.yaml' --include='*.yml' --include='*.js' --include='*.cff' --include='*.toml' . | grep -vE 'node_modules|/dist/|pnpm-lock|/\.git/'` -
      returns no output.
- [ ] No dangling links to the removed dir:
      `grep -rn 'python/' --include='*.md' . | grep -vE 'node_modules|/\.git/'` -
      returns no output.
- [ ] `ROADMAP.md`: `## v0.x — Python adapter` heading is gone
      (`grep -n 'Python adapter' ROADMAP.md` returns nothing) and
      `## v1.x — Custom PDF writer (gated)` still present.
- [ ] `docs/README.md`: `## Python` heading is gone and both `## Frameworks` and
      `## Integrations` still present.
- [ ] `pnpm format:check` - clean (remaining/edited Markdown is Prettier-clean).
- [ ] `pnpm lint` - clean.
- [ ] `pnpm typecheck` - 0 errors (sanity; should be unaffected by docs).

## Human verification checklist (judgment calls)

- [ ] The docs index (`docs/README.md`) and `ROADMAP.md` read coherently with
      the Python section gone - no orphaned intro sentence, no awkward gap, the
      TS-only framing is consistent.
- [ ] No remaining prose anywhere implies a Python product is coming (the repo
      should now read as unambiguously TypeScript-only).
- [ ] Confirm you genuinely want to drop the Python roadmap commitment publicly
      (this is a product-direction signal to anyone watching the repo), and that
      no external doc/site/issue still promises it.
