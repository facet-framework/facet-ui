#!/bin/sh
# Download the published package and verify its source and contents.
set -eu

fail() { printf 'release-npm-assets: %s\n' "$*" >&2; exit 2; }
[ "$#" -eq 4 ] || fail 'usage: release-npm-assets.sh TAG REPOSITORY SOURCE DIST'
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
tag=$1 repo=$2 source=$3 dist=$4
case "$tag" in v*) ;; *) fail 'expected a v-prefixed release tag' ;; esac
version=${tag#v}
sh "$here/release-version.sh" "$version"
tarball="facet-tools-ui-$version.tgz"
commit=$(git -C "$source" rev-parse HEAD)
jq -e --arg version "$version" '.name == "@facet-tools/ui" and .version == $version' \
  "$source/package.json" >/dev/null || fail "source package does not match $tag"

release=$(gh release view "$tag" --repo "$repo" --json isDraft,isImmutable,tagName) ||
  fail "cannot read release $tag"
printf '%s\n' "$release" | jq -e --arg tag "$tag" '
  .isDraft == false and .isImmutable == true and .tagName == $tag' >/dev/null ||
  fail "expected a published immutable release for $tag"
gh release download "$tag" --repo "$repo" --dir "$dist" --pattern "$tarball" --pattern checksums.txt
sh "$here/release-assets-check.sh" "$version" "$dist"
gh attestation verify "$dist/$tarball" --repo "$repo" \
  --signer-workflow "$repo/.github/workflows/release.yml" \
  --source-digest "$commit" --source-ref refs/heads/main
