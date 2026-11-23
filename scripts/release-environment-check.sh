#!/bin/sh
# Verify the workflow's protections before entering its deployment environment.
set -eu

if [ "$#" -ne 1 ] || { [ "$1" != release ] && [ "$1" != npm ]; }; then
  echo 'Usage: release-environment-check.sh release|npm' >&2
  exit 2
fi
if [ -z "${GH_TOKEN:-}" ]; then
  echo 'release-environment-check: RELEASE_SETTINGS_TOKEN is required' >&2
  exit 2
fi

scope=$1
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
release_gh() { gh "$@"; }
. "$root/scripts/release-settings-check.sh"
