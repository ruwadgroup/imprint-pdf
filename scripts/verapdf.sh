#!/usr/bin/env bash
#
# Run veraPDF over a directory of fixture PDFs and exit non-zero on any
# validation failure. Driven by `.github/workflows/verapdf.yml` and
# usable locally via `pnpm verapdf:ci`.
#
# Inputs:
#   $1  Validation profile (e.g. `pdfa-2b`, `pdfa-3b`, `ua-1`).
#   $2+ Glob(s) of PDFs to validate. Defaults to the fixtures dir.
#
# Requires: java + a `verapdf` CLI on $PATH (see workflow setup).
#

set -euo pipefail

PROFILE="${1:-pdfa-2b}"
shift || true

if (( $# == 0 )); then
  set -- "fixtures/verapdf/*.pdf"
fi

if ! command -v verapdf >/dev/null 2>&1; then
  echo "::error::veraPDF CLI not found on \$PATH. Run scripts/verapdf-install.sh first." >&2
  exit 127
fi

EXIT_CODE=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for pattern in "$@"; do
  for pdf in $pattern; do
    [ -e "$pdf" ] || continue
    REPORT="$TMP/$(basename "$pdf").xml"
    echo "→ veraPDF [$PROFILE] $pdf"
    if ! verapdf --format xml --flavour "$PROFILE" "$pdf" > "$REPORT"; then
      echo "::error file=$pdf::veraPDF reported a validation failure ($PROFILE)"
      grep -E '<failedRules|<rule' "$REPORT" || true
      EXIT_CODE=1
    fi
  done
done

exit "$EXIT_CODE"
