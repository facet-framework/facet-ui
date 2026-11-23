#!/bin/sh
# Stage the verified tarball for npm approval through trusted publishing.
set -eu

fail() { printf 'release-npm-publish: %s\n' "$*" >&2; exit 2; }
[ "$#" -eq 2 ] || fail 'usage: release-npm-publish.sh VERSION DIST'
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
version=$1
sh "$here/release-assets-check.sh" "$version" "$2"
cd -- "$2"
tarball="./facet-tools-ui-$version.tgz"
package="@facet-tools/ui@$version"
metadata=$(tar -xOzf "$tarball" package/package.json) || fail 'cannot read the package manifest'
printf '%s\n' "$metadata" | jq -e --arg version "$version" '
  .name == "@facet-tools/ui" and .version == $version' >/dev/null ||
  fail "tarball manifest does not describe $package"

scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
trap 'exit 2' HUP INT TERM
openssl dgst -sha512 -binary -out "$scratch/digest" "$tarball" || fail "cannot compute integrity for $package"
digest=$(openssl base64 -A -in "$scratch/digest") || fail "cannot encode integrity for $package"
integrity="sha512-$digest"
err="$scratch/npm-error"
registry=https://registry.npmjs.org
if found=$(npm view "$package" dist.integrity --registry "$registry" 2>"$err"); then
  if [ "$found" = "$integrity" ]; then
    echo "release-npm-publish: $package is already published with this tarball; skipped"
    exit 0
  fi
  fail "$package is published with different or missing integrity"
elif ! grep -Fxq 'npm error code E404' "$err"; then
  fail "cannot query $package: $(cat "$err")"
fi

# Candidates through the first stable version use latest, as do stable releases.
case "$version" in
  0.0.*-*|0.1.0-*) tag=latest ;;
  *-*) tag=next ;;
  *) tag=latest ;;
esac
if npm stage publish "$tarball" --access public --provenance --tag "$tag" --registry "$registry" 2>"$err"; then
  cat "$err" >&2
  echo "release-npm-publish: $package staged with dist-tag $tag, awaiting approval on npmjs.com"
elif grep -Fxq 'npm error code E409' "$err" && grep -Fq 'Cannot publish over previously staged version' "$err"; then
  echo "release-npm-publish: $package staged earlier, tag fixed at staging; awaiting approval on npmjs.com"
else
  fail "cannot stage $package: $(cat "$err")"
fi
