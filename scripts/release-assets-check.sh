#!/bin/sh
# Require the checksum file to identify exactly the expected tarball.
set -eu

[ "$#" -eq 2 ] || { echo 'Usage: release-assets-check.sh VERSION DIRECTORY' >&2; exit 2; }
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
sh "$here/release-version.sh" "$1"
tarball="facet-tools-ui-$1.tgz"
cd -- "$2"
[ -f "$tarball" ] && [ -f checksums.txt ] || {
  echo "release-assets-check: expected $tarball and checksums.txt" >&2
  exit 2
}
checksum=$(sha256sum -- "$tarball")
printf '%s\n' "$checksum" | cmp -s checksums.txt - || {
  echo "release-assets-check: checksum does not match $tarball" >&2
  exit 2
}
