# Releasing

Maintainers only. Two paths: **CI (Trusted Publishing, preferred)** and **local
fallback (npm token, emergency)**.

---

## Publishable packages

The 11 packages that ship to npm:

```
@imprint-pdf/core    @imprint-pdf/eslint   @imprint-pdf/sign
@imprint-pdf/react   @imprint-pdf/print    @imprint-pdf/ua
@imprint-pdf/next    @imprint-pdf/cli      @imprint-pdf/vite
@imprint-pdf/fonts   @imprint-pdf/svg-rasterize
```

These are marked `"private": true` and never get published:

```
@imprint-pdf/bench   @imprint-pdf/icu-wasm    @imprint-pdf/tailwind
@imprint-pdf/e2e     @imprint-pdf/taffy-wasm  @imprint-pdf/testing
```

`@imprint-pdf/tailwind` is intentionally kept as a private workspace package and
is inlined into `react`/`next`/`vite`'s dist via tsup's
`noExternal: ['@imprint-pdf/tailwind']`. Don't remove that config or the shipped
tarballs will be incomplete.

---

## One-time setup

Before the first CI publish ever works, each of the 9 publishable packages needs
a **Trusted Publisher** row configured on npm. Without this every CI publish
returns `E404 Not Found`.

For each package, visit `https://www.npmjs.com/package/<name>/access` →
**Trusted Publishers** → **Add Trusted Publisher** → **GitHub Actions**:

| Field                | Value            |
| -------------------- | ---------------- |
| Publisher            | `GitHub Actions` |
| Organization or user | `tamimbinhakim`  |
| Repository           | `imprint-pdf`    |
| Workflow filename    | `release.yml`    |
| Environment name     | _(leave blank)_  |

Then on the same page under **Package Access**, set "Two-factor authentication
for publishing" to **"Authorization only"** (not "and writes"). The "and writes"
mode requires an OTP per publish, which OIDC cannot supply, and npm returns 404
for security.

The npm user that configures these rows must be an **owner** of each package,
not just a maintainer.

---

## Standard release (CI / Trusted Publishing)

1. Land your work on `main`.
2. Add a changeset describing the change:

   ```bash
   pnpm changeset
   ```

   Interactively pick which packages bump and at what level. Write the
   user-facing release-notes line.

3. Push.
4. The Release workflow opens (or updates) a **"Version Packages" PR** that
   bumps the touched packages' `package.json` versions and writes their
   `CHANGELOG.md` entries from your changesets.
5. Review and **merge** the Version Packages PR.
6. The workflow runs `pnpm release` on `main` →
   `turbo run build --filter=./packages/*` → `changeset publish` → npm publish
   (OIDC + sigstore provenance) → GitHub Releases → git tags. No `NPM_TOKEN`
   involved.

### Prerelease (alpha / beta / rc)

```bash
pnpm changeset pre enter alpha   # or beta, rc
# work + add changesets as usual
# merge Version Packages PR → publishes as 1.0.0-alpha.X
pnpm changeset pre exit          # when ready to graduate to a stable tag
```

Note: `changeset publish` uses the `latest` dist-tag by default even for
prereleases. After publishing a prerelease that you don't want to be the default
install target, demote it:

```bash
# Promote the previous stable back to `latest`
NPM_CONFIG_USERCONFIG="$WORK/.npmrc" npm dist-tag add \
  "@imprint-pdf/<pkg>@<stable-version>" latest
# Tag the prerelease explicitly
NPM_CONFIG_USERCONFIG="$WORK/.npmrc" npm dist-tag add \
  "@imprint-pdf/<pkg>@<prerelease>" next
```

---

## Local fallback (emergency, no CI)

Use when Trusted Publishing isn't set up yet, when CI is broken, or when you
need to ship right now.

⚠️ **Rotate the token afterwards.** Tokens used locally show up in shell
history, screenshots, etc.

```bash
# 0. Make sure the working tree is clean and tests pass
pnpm typecheck && pnpm test

# 1. Bump versions (the CI flow normally does this for you)
pnpm changeset version         # or hand-edit package.json files

# 2. Build all 9 publishable packages
pnpm --filter "./packages/*" build

# 3. Disable provenance — OIDC isn't available locally
for p in core react next vite cli eslint print sign ua; do
  sed -i '' '/"publishConfig":/,/}/ s/"provenance": true/"provenance": false/' \
    "packages/$p/package.json"
done

# 4. Publish with a token in an isolated .npmrc
export NPM_TOKEN="npm_..."  # an automation token from npmjs.com/settings/<user>/tokens
WORK=$(mktemp -d)
cat > "$WORK/.npmrc" <<EOF
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}
registry=https://registry.npmjs.org/
EOF
NPM_CONFIG_USERCONFIG="$WORK/.npmrc" pnpm changeset publish

# 5. Promote `latest` if you published a prerelease that should be installable
#    by default (changesets doesn't auto-promote prereleases)
for p in core react next vite cli eslint print sign ua; do
  NPM_CONFIG_USERCONFIG="$WORK/.npmrc" npm dist-tag add \
    "@imprint-pdf/$p@<your-version>" latest
done

# 6. Clean up the temp .npmrc
rm -rf "$WORK"

# 7. Re-enable provenance for the next CI publish
for p in core react next vite cli eslint print sign ua; do
  sed -i '' '/"publishConfig":/,/}/ s/"provenance": false/"provenance": true/' \
    "packages/$p/package.json"
done
git add packages/*/package.json && git commit -m "ci(release): re-enable provenance"

# 8. Push the git tags changesets created during publish
git push origin main --follow-tags

# 9. Rotate the token you used at npmjs.com/settings/<user>/tokens
```

---

## Adding a new publishable package

1. Create `packages/<name>/` with a `package.json` (no `"private": true`).
2. Add `"publishConfig": { "access": "public", "provenance": true }`.
3. Configure a Trusted Publisher row on npm (same fields as above) once the
   first version is published.
4. Add it to the publish list in this doc.

## Marking a publishable package internal

1. Add `"private": true` to its `package.json`. changesets will now skip it.
2. If any other publishable package imports from it, add it to that package's
   `tsup.config.ts` `noExternal` so its code is inlined into the consumer's dist
   (otherwise consumers installing from npm will get a broken install).
3. If the package was previously published, deprecate or unpublish:

   ```bash
   npm deprecate "@imprint-pdf/<name>" "no longer published — bundled into @imprint-pdf/<consumer>"
   # OR (only if no other npm packages depend on it)
   npm unpublish "@imprint-pdf/<name>" --force
   ```

---

## Pre-publish checklist

Before merging the Version Packages PR (or running the local fallback):

- `pnpm typecheck` — all 23 task targets clean
- `pnpm test` — all 24 task targets pass (104 core + 31 e2e + the rest)
- `pnpm --filter "./packages/*" build` — every package builds
- `git status` — nothing uncommitted
- veraPDF validation examples pass for `@imprint-pdf/print` and
  `@imprint-pdf/ua` if you touched them
- Each new CHANGELOG entry reads like an end-user release note (not a commit
  subject)

---

## Common errors

### `E404 Not Found - PUT https://registry.npmjs.org/@imprint-pdf%2f<pkg>`

Trusted Publisher row missing or misconfigured on that package, OR Package
Access 2FA is set to "Authorization and writes". See the one-time setup section
above.

### `Automatic provenance generation not supported for provider: null`

You're running the publish locally (no OIDC token available). Disable provenance
for the local publish — see the fallback flow above.

### `E422 Unprocessable Entity` on `npm unpublish`

Other published packages still list the target as a dependency / peer. Either
unpublish those consumer versions first (only possible within 72 h of publish),
or fall back to `npm deprecate`.

### `Workspace dep cannot be resolved` at publish time

A consumer package has a `workspace:*` reference to a private package that isn't
in `noExternal`. Either add it to `noExternal` (inline the code) or make the
private package publishable.

---

## Quick links

- npm Trusted Publishing setup:
  `https://www.npmjs.com/package/@imprint-pdf/<name>/access`
- npm tokens: https://www.npmjs.com/settings/tamimbinhakim/tokens
- GitHub Actions runs:
  https://github.com/tamimbinhakim/imprint-pdf/actions/workflows/release.yml
- changesets docs:
  https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md
