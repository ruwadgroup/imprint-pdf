# Releasing

Maintainers only.

## Standard release

```bash
# 1. Merge all release-ready PRs to main.
# 2. The "Version packages" PR is opened automatically by the changeset bot.
#    Review, merge it.
# 3. The release workflow publishes to npm automatically on merge.
```

## Manual release (emergency)

```bash
pnpm install
pnpm build --filter=./packages/*
pnpm changeset version
git add .
git commit -m "chore: version packages"
pnpm changeset publish
git push --follow-tags
```

## Beta / prerelease

```bash
pnpm changeset pre enter beta
# make changes, add changesets
pnpm changeset version   # bumps to 1.0.0-beta.x
pnpm changeset publish --tag beta
pnpm changeset pre exit
```

## Checks before publishing

- CI green on `main`
- `pnpm audit` clean
- veraPDF validation examples pass for `@imprint-pdf/print` and
  `@imprint-pdf/ua`
- CHANGELOG entries make sense to an end-user
