#!/bin/sh
# Validate the version before using it in a ref or an asset name.
set -eu
if [ "$#" -ne 1 ] || ! jq -en --arg version "$1" '
  "(0|[1-9][0-9]{0,8})" as $number
  | $version | test("\\A" + $number + "\\." + $number + "\\." + $number + "(-rc\\.[1-9][0-9]{0,8})?\\z")
' >/dev/null; then
  echo 'release-version: expected MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-rc.N' >&2
  exit 2
fi
