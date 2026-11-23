#!/bin/sh
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
for valid in 0.0.0 0.1.0-rc.1 1.0.0 999999999.2.0-rc.999999999; do
  sh "$here/release-version.sh" "$valid"
done
for invalid in '' -v0.1.0 0.01.0 0.1 0.1.0-rc.0 0.1.0-rc.01 0.1.0-rc.1_more 0.1.0-beta.1 \
  1000000000.0.0 '0.1.0
extra'; do
  result=0
  sh "$here/release-version.sh" "$invalid" 2>/dev/null || result=$?
  [ "$result" -eq 2 ]
done
echo 'OK: release versions accept only bounded stable and release candidate forms'
