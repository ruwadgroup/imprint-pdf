# Changesets

Changesets tracks what changed and in which packages, then writes CHANGELOG
entries and bumps versions on release.

## Authoring a changeset

```bash
pnpm changeset
```

Pick the affected `@imprint-pdf/*` packages, choose a bump kind (`patch` /
`minor` / `major`), and write a one-sentence summary aimed at end-users. Commit
the generated `.md` file alongside your PR.

Skip changesets for: docs-only edits, internal tooling, CI tweaks that do not
alter published behaviour.

## Release flow

Maintainers only. See [`.github/RELEASING.md`](../.github/RELEASING.md).
