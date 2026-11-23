#!/bin/sh
# Use a draft so an interrupted upload can be retried before publication.
set -eu

fail() { printf 'release-publish: %s\n' "$*" >&2; exit 2; }
[ "$#" -eq 3 ] || fail 'usage: release-publish.sh VERSION REPOSITORY DIST'
[ -n "${GH_TOKEN:-}" ] || fail 'a workflow token is required'
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
version=$1 repo=$2 dist=$3
sh "$here/release-assets-check.sh" "$version" "$dist"
tag="v$version"
tarball="facet-tools-ui-$version.tgz"
title="FACET UI $version"
prerelease=false
case "$version" in *-rc.*) prerelease=true ;; esac

if result=$(gh release view "$tag" --repo "$repo" --json isDraft,isImmutable,tagName 2>&1); then
  state=$(printf '%s' "$result" | jq -er --arg tag "$tag" '
    select(.tagName == $tag and (.isDraft | type) == "boolean")
    | if .isDraft then "draft" elif .isImmutable == true then "immutable" else "published" end') ||
    fail "cannot verify release $tag"
  case "$state" in
    draft) ;;
    immutable)
      scratch=$(mktemp -d)
      trap 'rm -rf -- "$scratch"' EXIT
      trap 'exit 2' HUP INT TERM
      gh release download "$tag" --repo "$repo" --dir "$scratch" --pattern "$tarball" --pattern checksums.txt
      cmp -s "$dist/checksums.txt" "$scratch/checksums.txt" && cmp -s "$dist/$tarball" "$scratch/$tarball" ||
        fail "$tag has different published assets"
      echo "release-publish: $tag already has these published assets"
      exit 0
      ;;
    *) fail "$tag has a mutable published release" ;;
  esac
else
  case "$result" in
    'release not found') gh release create "$tag" --repo "$repo" --verify-tag --draft \
      --prerelease="$prerelease" --title "$title" --notes-file CHANGELOG.md ;;
    *) fail "cannot read release $tag: $result" ;;
  esac
fi

gh release upload "$tag" "$dist/$tarball" "$dist/checksums.txt" --repo "$repo" --clobber
result=$(gh release view "$tag" --repo "$repo" --json isDraft,tagName,assets) ||
  fail "cannot verify uploaded assets for $tag"
printf '%s\n' "$result" | jq -e --arg tag "$tag" --arg tarball "$tarball" '
  .isDraft == true and .tagName == $tag
  and ([.assets[].name] | sort) == (["checksums.txt", $tarball] | sort)
' >/dev/null || fail "$tag does not contain exactly the expected assets"
gh release edit "$tag" --repo "$repo" --prerelease="$prerelease" --title "$title" \
  --notes-file CHANGELOG.md --draft=false
