#!/bin/sh
# Create a release tag for the approved squash commit with the workflow token.
set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
fail() { printf 'release-tag: %s\n' "$*" >&2; exit 2; }
[ "$#" -eq 2 ] || fail 'usage: release-tag.sh VERSION REPOSITORY'
version=$1 repo=$2
[ -n "${GH_TOKEN:-}" ] || fail 'a workflow token is required'
sh "$here/release-pr-check.sh" "$version" "$repo" || exit 2
commit=$(git -C "$here" rev-parse HEAD)
ref="refs/tags/v$version"

response=$(gh api --hostname github.com --method GET --paginate --slurp \
  "repos/$repo/git/matching-refs/tags/v$version?per_page=100") || fail "cannot read $ref"
existing=$(printf '%s' "$response" | jq -er --arg ref "$ref" '
  select(type == "array" and length > 0 and all(.[]; type == "array"))
  | [.[][] | select(.ref == $ref)]
  | if length == 0 then "" else
      select(length == 1) | .[0].object | select(.type == "commit")
      | .sha | strings | select(test("^[a-f0-9]{40}$"))
    end') || fail "cannot verify $ref as a lightweight tag"
if [ -n "$existing" ]; then
  [ "$existing" = "$commit" ] || fail "$ref already points to $existing, expected $commit"
  printf 'release-tag: %s already points to %s\n' "$ref" "$commit"
else
  git -C "$here" -c push.followTags=false push --force-with-lease="$ref:" origin "$commit:$ref" ||
    fail "cannot create $ref"
  printf 'release-tag: %s points to %s\n' "$ref" "$commit"
fi
