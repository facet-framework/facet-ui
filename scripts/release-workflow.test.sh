#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
release="$root/.github/workflows/release.yml"
ci="$root/.github/workflows/ci.yml"

# Dispatches must reach the first step even when they target a non-main ref.
grep -Fxq "    if: github.event_name == 'workflow_dispatch' || (github.ref == 'refs/heads/main' && github.repository == 'facet-framework/facet-ui')" "$release"
ref_guard=$(awk '
  /^    steps:$/ { in_steps = 1; next }
  in_steps && /^      - / {
    if (in_guard || $0 != "      - name: Require main") exit
    in_guard = 1
  }
  in_guard && /^          / { print substr($0, 11) }
' "$release")
[ -n "$ref_guard" ]
GITHUB_REF=refs/heads/main bash -e -c "$ref_guard"
for ref in refs/heads/feature refs/tags/v0.1.0; do
  result=0
  output=$(GITHUB_REF="$ref" bash -e -c "$ref_guard" 2>&1) || result=$?
  if [ "$result" -ne 1 ] || [ "$output" != '::error::Release dry runs must run from refs/heads/main' ]; then
    printf 'Expected release dry run on %s to fail with an explicit ref error; got exit %s: %s\n' "$ref" "$result" "$output" >&2
    exit 1
  fi
done

# Main CI runs must be independent even while they are queued.
grep -Fxq "  group: ci-\${{ github.ref == 'refs/heads/main' && github.run_id || github.ref }}" "$ci"
grep -Fxq "  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}" "$ci"
echo 'OK: release dry-run ref guard and main CI concurrency'
