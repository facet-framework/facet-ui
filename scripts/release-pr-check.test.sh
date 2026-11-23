#!/bin/sh
# Use real Git commits and a local remote, with synthetic GitHub responses.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
work=$(mktemp -d "${TMPDIR:-/tmp}/facet-ui-pr-check.XXXXXX")
trap 'rm -r "$work"' EXIT
trap 'exit 1' HUP INT TERM
export TMPDIR="$work" GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_ALLOW_PROTOCOL=file
export GIT_AUTHOR_NAME=Fixture GIT_AUTHOR_EMAIL=fixture@example.invalid
export GIT_COMMITTER_NAME=Fixture GIT_COMMITTER_EMAIL=fixture@example.invalid
export GH_TOKEN=fixture FIXTURE_API="$work/api"
export PATH="$work/bin:$PATH"

pub="$work/facet-ui"
mkdir -p "$pub/scripts" "$FIXTURE_API" "$work/bin"
cp "$root/scripts/release-pr-check.sh" "$root/scripts/release-reviews.jq" \
  "$root/scripts/release-tag.sh" "$root/scripts/release-version.sh" "$pub/scripts"
cat > "$work/bin/gh" <<'MOCK'
#!/bin/sh
set -eu
[ "$1 $2 $3 $4 $5" = 'api --hostname github.com --method GET' ]
shift 5
case "$*" in
  '--paginate --slurp '*) shift 2 ;;
  *'per_page=100') exit 70 ;;
esac
[ "$#" -eq 1 ]
cat "$FIXTURE_API/$(printf '%s' "$1" | tr / _).json"
MOCK
chmod +x "$work/bin/gh"

version=0.2.0-rc.4
repo=example/facet-ui
printf '{"version":"%s"}\n' "$version" > "$pub/package.json"
git init -q --bare "$work/remote"
git -C "$pub" init -q -b main
git -C "$pub" commit -qm 'older base' --allow-empty
older=$(git -C "$pub" rev-parse HEAD)
git -C "$pub" commit -qm base --allow-empty
base=$(git -C "$pub" rev-parse HEAD)
git -C "$pub" add .
git -C "$pub" commit -qm 'curated release'
head=$(git -C "$pub" rev-parse HEAD)
tree=$(git -C "$pub" rev-parse 'HEAD^{tree}')
squash=$(git -C "$pub" commit-tree "$tree" -p "$base" -m 'squash release')
git -C "$pub" reset -q --hard "$squash"
git -C "$pub" remote add origin "$work/remote"
git -C "$pub" push -q origin "$squash:refs/heads/main"

write_pr_fixtures() {
  list="$FIXTURE_API/repos_example_facet-ui_commits_${squash}_pulls?per_page=100.json"
  pr="$FIXTURE_API/repos_example_facet-ui_pulls_7.json"
  reviews="$FIXTURE_API/repos_example_facet-ui_pulls_7_reviews?per_page=100.json"
  object="$FIXTURE_API/repos_example_facet-ui_git_commits_$head.json"
  jq -n --arg squash "$squash" --arg ref "release/$version" '
    [[],[{number: 7, merge_commit_sha: $squash, head: {ref: $ref}}]]' > "$list"
  jq -n --arg squash "$squash" --arg head "$head" --arg branch "release/$version" --arg repo "$repo" '
  {number: 7, merged: true, merged_at: "2026-01-01T23:00:00Z", merge_commit_sha: $squash,
   user: {id: 9}, base: {ref: "main", repo: {full_name: $repo}},
   head: {ref: $branch, repo: {full_name: $repo}, sha: $head}}' > "$pr"
  jq -n --arg head "$head" '[[],[{id: 5, state: "APPROVED", author_association: "OWNER",
   user: {id: 10}, commit_id: $head, submitted_at: "2026-01-01T22:00:00Z"}]]' > "$reviews"
  jq -n --arg sha "$head" --arg tree "$tree" --arg parent "$base" '
  {sha: $sha, tree: {sha: $tree}, parents: [{sha: $parent}]}' > "$object"
}
write_pr_fixtures
tags="$FIXTURE_API/repos_example_facet-ui_git_matching-refs_tags_v$version?per_page=100.json"
printf '[[]]\n' > "$tags"
for fixture in "$list" "$pr" "$reviews" "$object"; do cp "$fixture" "$fixture.good"; done

tag() { sh "$pub/scripts/release-tag.sh" "${1:-$version}" "$repo"; }
refuses() {
  result=0
  tag "${2:-$version}" >"$work/out" 2>&1 || result=$?
  if [ "$result" -ne 2 ] || ! grep -Fq "$1" "$work/out" ||
    [ -n "$(git -C "$work/remote" for-each-ref refs/tags)" ]; then
    cat "$work/out" >&2
    echo "Expected refusal before tagging: $1" >&2
    exit 1
  fi
}
edit() { jq "$2" "$1.good" > "$1"; }
restore() { cp "$1.good" "$1"; }

gate() { sh "$pub/scripts/release-pr-check.sh" --if-release "$version" "$repo"; }
gate
edit "$list" '.[1][0].head.ref = "feature/ordinary"'
result=0
gate > "$work/out" 2>&1 || result=$?
[ "$result" -eq 3 ]
grep -Fq 'no release pull request' "$work/out"
restore "$list"

merge=$(git -C "$pub" commit-tree "$tree" -p "$base" -p "$head" -m 'two-parent merge')
jq --arg merge "$merge" '.[1][0].merge_commit_sha = $merge' "$list" \
  > "$FIXTURE_API/repos_example_facet-ui_commits_${merge}_pulls?per_page=100.json"
git -C "$pub" reset -q --hard "$merge"
refuses 'must have exactly one parent'
git -C "$pub" reset -q --hard "$squash"
refuses 'differs from the UI source version' '0.2.0-rc.5'
edit "$list" '[[]]'
refuses 'expected one pull request'
edit "$list" '. + [[.[1][0] | .number = 8]]'
refuses 'expected one pull request'
restore "$list"

edit "$pr" '.merged = false'
refuses 'was not merged'
edit "$pr" '.base.ref = "develop"'
refuses 'must target example/facet-ui main'
edit "$pr" '.head.ref = "other"'
refuses 'must come from'
edit "$pr" '.head.repo.full_name = "fork/facet-ui"'
refuses 'must come from'
restore "$pr"

edit "$object" '.tree.sha = "1111111111111111111111111111111111111111"'
refuses 'but approved pull request'
jq --arg older "$older" '.parents[0].sha = $older' "$object.good" > "$object"
refuses 'as its only parent'
jq --arg older "$older" '.parents += [{sha: $older}]' "$object.good" > "$object"
refuses 'as its only parent'
restore "$object"
edit "$reviews" '[{}]'
refuses 'cannot interpret reviews'

for change in \
  '[[]]' \
  '.[1][0].commit_id = "1111111111111111111111111111111111111111"' \
  '.[1][0].author_association = "CONTRIBUTOR"' \
  '.[1][0].user.id = 9' \
  '.[1][0].submitted_at = "2026-01-01T23:01:00Z"' \
  '. + [[.[1][0] | .state = "DISMISSED" | .id = 6]]' \
  '. + [[.[1][0] | .state = "CHANGES_REQUESTED" | .id = 6]]'; do
  edit "$reviews" "$change"
  refuses 'has no approving review'
done
edit "$reviews" '.[1][0].submitted_at = "2026-01-01T23:00:00Z"
  | . + [[.[1][0] | .state = "PENDING" | .id = 6 | .submitted_at = null],
    [.[1][0] | .state = "COMMENTED" | .id = 7]]'

git clone -q --no-local --depth=1 "$pub" "$work/shallow"
pub="$work/shallow"
[ "$(git -C "$pub" rev-parse --is-shallow-repository)" = true ]
git -C "$pub" remote set-url origin "$work/remote"

write_tag() {
  jq -n --arg ref "refs/tags/v$version" --arg sha "$1" --arg type "$2" '
    [[{ref: $ref, object: {sha: $sha, type: $type}}]]' > "$tags"
}
write_tag "$head" commit
refuses 'already points to'
write_tag "$squash" tag
refuses 'cannot verify'
printf '[[]]\n' > "$tags"
git --git-dir="$work/remote" update-ref "refs/tags/v$version" "$base"
result=0
tag >"$work/out" 2>&1 || result=$?
[ "$result" -eq 2 ]
grep -Fq 'cannot create' "$work/out"
[ "$(git --git-dir="$work/remote" rev-parse "refs/tags/v$version")" = "$base" ]
git --git-dir="$work/remote" update-ref -d "refs/tags/v$version"
tag
[ "$(git -C "$work/remote" rev-parse "refs/tags/v$version^{commit}")" = "$squash" ]
[ -z "$(git -C "$pub" tag)" ]
[ "$head" != "$squash" ]
write_tag "$squash" commit
tag | grep -Fq "already points to $squash"

pub="$work/facet-ui"
version=0.2.0
printf '{"version":"%s"}\n' "$version" > "$pub/package.json"
git -C "$pub" add package.json
tree=$(git -C "$pub" write-tree)
head=$(git -C "$pub" commit-tree "$tree" -p "$base" -m 'curated stable release')
squash=$(git -C "$pub" commit-tree "$tree" -p "$base" -m 'squash stable release')
git -C "$pub" reset -q --hard "$squash"
write_pr_fixtures
sh "$pub/scripts/release-pr-check.sh" "$version" "$repo"
echo 'OK: release PR reviews, tree and sole parent gate tag creation on the squash commit'
