#!/usr/bin/env sh
#
# Verify that the checked-out commit is the reviewed release PR's squash
# result. The PR head may have been deleted after merge; use its saved SHA.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

fail() {
  echo "release-pr-check: $*" >&2
  exit 2
}

optional=false
if [ "${1:-}" = --if-release ]; then
  optional=true
  shift
fi
[ "$#" -eq 2 ] || fail "usage: release-pr-check.sh [--if-release] <version> <owner>/<repo>"
version=$1
repo=$2
branch="release/$version"

commit=$(git -C "$ROOT" rev-parse HEAD)
pulls=$(gh api --hostname github.com --method GET --paginate --slurp "repos/$repo/commits/$commit/pulls?per_page=100") ||
  fail "cannot find pull requests for $commit; the job token needs Pull requests read"
if [ "$optional" = true ]; then
  subject=$(git -C "$ROOT" log -1 --format=%s "$commit")
  candidate=$(printf '%s' "$pulls" | jq -er --arg sha "$commit" '
    select(type == "array" and length > 0 and all(.[]; type == "array"))
    | any(.[][]; .merge_commit_sha == $sha and ((.head.ref // "") | startswith("release/")))
    | tostring') || fail "cannot interpret pull requests for $commit"
  case "$subject:$candidate" in
    'release(ui): v'*|*:true) ;;
    *) echo 'release-pr-check: no release pull request for this push' >&2; exit 3 ;;
  esac
fi

source_version=$(jq -er '.version | strings' "$ROOT/package.json") ||
  fail "cannot read the UI source version"
[ "$version" = "$source_version" ] ||
  fail "requested version $version differs from the UI source version ($source_version)"
sh "$SCRIPT_DIR/release-version.sh" "$version" || exit 2

tree=$(git -C "$ROOT" rev-parse 'HEAD^{tree}')
# The workflow uses a shallow checkout. Read the parent from the commit header.
squash_object=$(git -C "$ROOT" cat-file commit "$commit")
squash_parent=$(printf '%s\n' "$squash_object" | awk '
  /^$/ { exit }
  /^parent / { parent = $2; count++ }
  END { if (count != 1) exit 1; print parent }') ||
  fail "$commit must have exactly one parent for a squash release"

number=$(printf '%s' "$pulls" | jq -er --arg sha "$commit" '
  [ .[][] | select(.merge_commit_sha == $sha) | .number ]
  | select(length == 1) | .[0] | select(type == "number")') ||
  fail "expected one pull request that produced $commit"
pull=$(gh api --hostname github.com --method GET "repos/$repo/pulls/$number") ||
  fail "cannot read pull request #$number; the job token needs Pull requests read"
printf '%s' "$pull" | jq -e --arg sha "$commit" '
  .merged == true and .merge_commit_sha == $sha
  and (.merged_at | strings | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"))' >/dev/null ||
  fail "pull request #$number was not merged as $commit"
printf '%s' "$pull" | jq -e --arg repo "$repo" '
  .base.ref == "main" and .base.repo.full_name == $repo' >/dev/null ||
  fail "pull request #$number must target $repo main"
printf '%s' "$pull" | jq -e --arg repo "$repo" --arg branch "$branch" '
  .head.ref == $branch and .head.repo.full_name == $repo' >/dev/null ||
  fail "pull request #$number must come from $repo $branch"
head=$(printf '%s' "$pull" | jq -er '.head.sha | select(test("^[a-f0-9]{40}$"))') ||
  fail "pull request #$number has no valid head SHA"
merged_at=$(printf '%s' "$pull" | jq -r .merged_at)
author=$(printf '%s' "$pull" | jq -er '.user.id | select(type == "number")') ||
  fail "pull request #$number has no valid author ID"

reviews=$(gh api --hostname github.com --method GET --paginate --slurp "repos/$repo/pulls/$number/reviews?per_page=100") ||
  fail "cannot read reviews of pull request #$number; the job token needs Pull requests read"
approvals=$(printf '%s' "$reviews" | jq -c --arg head "$head" --arg until "$merged_at" \
  --argjson author "$author" -f "$SCRIPT_DIR/release-reviews.jq") ||
  fail "cannot interpret reviews of pull request #$number"
printf '%s' "$approvals" | jq -e 'length > 0' >/dev/null ||
  fail "pull request #$number has no approving review from an owner, member or collaborator for $head at merge time"

head_commit=$(gh api --hostname github.com --method GET "repos/$repo/git/commits/$head") ||
  fail "cannot read pull request head $head; the job token needs Contents read"
head_tree=$(printf '%s' "$head_commit" | jq -er --arg head "$head" '
  select(.sha == $head) | .tree.sha | select(test("^[a-f0-9]{40}$"))') ||
  fail "pull request head $head has no valid tree SHA"
printf '%s' "$head_commit" | jq -e --arg parent "$squash_parent" '
  select(.parents | type == "array") | [.parents[].sha] == [$parent]' >/dev/null ||
  fail "pull request #$number head $head must have squash parent $squash_parent as its only parent"
[ "$tree" = "$head_tree" ] ||
  fail "merge commit $commit has tree $tree, but approved pull request #$number has tree $head_tree"

echo "release-pr-check: $commit matches the approved $branch tree from pull request #$number"
