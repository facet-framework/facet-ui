#!/bin/sh
# Exercise both entry points against GitHub-shaped responses.
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
root=$(CDPATH= cd -- "$here/.." && pwd)
work=$(mktemp -d "${TMPDIR:-/tmp}/facet-ui-settings-check.XXXXXX")
trap 'rm -r "$work"' EXIT
trap 'exit 1' HUP INT TERM
export TMPDIR="$work" FIXTURE="$work" PATH="$work/bin:$PATH"
mkdir -p "$work/bin"
settings="$root/settings"

cp "$settings/ruleset-main.json" "$work/main.good"
cp "$settings/ruleset-tag.json" "$work/tag.good"
jq '. + {full_name:"facet-framework/facet-ui", visibility:"public"}' "$settings/repository-merge.json" > "$work/repo.good"
jq 'del(.branch_policies) | .protection_rules |= map(
    . + {id: 21, node_id: "rule"}
    | if .type == "required_reviewers" then .reviewers |= map(
      {type, reviewer: {id, login: "release-reviewer"}}) else . end)' "$settings/env-release.json" > "$work/env.good"
jq '[{branch_policies: []}, {branch_policies: [.branch_policies[] | . + {id: 23}]}]' \
  "$settings/env-release.json" > "$work/policies.good"
jq '[[], map({id: ., target:"tag", enforcement:"active"})]' "$settings/active-tag-rulesets.json" > "$work/active.good"
cp "$settings/immutable-releases.json" "$work/immutable.good"
jq 'del(.branch_policies)' "$settings/env-npm.json" > "$work/npm.good"
jq '[{branch_policies}]' "$settings/env-npm.json" > "$work/npm-policies.good"
for fixture in main tag repo env policies active immutable npm npm-policies; do cp "$work/$fixture.good" "$work/$fixture"; done

cat > "$work/bin/gh" <<'MOCK'
#!/bin/sh
set -eu
[ "${FIXTURE_THEO:-}" = 1 ] || [ "${GH_TOKEN:-}" = fixture-token ] || exit 70
[ "$1 $2 $3 $4 $5" = 'api --hostname github.com --method GET' ]
shift 5
endpoint=repos/facet-framework/facet-ui
case "$*" in
  "$endpoint/rulesets/27722422") fixture=main ;;
  "$endpoint/rulesets/27722423") fixture=tag ;;
  "--paginate --slurp $endpoint/rulesets?targets=tag&includes_parents=true&per_page=100") fixture=active ;;
  "$endpoint") fixture=repo ;;
  "$endpoint/environments/release") fixture=env ;;
  "--paginate --slurp $endpoint/environments/release/deployment-branch-policies?per_page=100") fixture=policies ;;
  "$endpoint/immutable-releases") fixture=immutable ;;
  "$endpoint/environments/npm") fixture=npm ;;
  "--paginate --slurp $endpoint/environments/npm/deployment-branch-policies?per_page=100") fixture=npm-policies ;;
  *) echo "Unexpected API request: $*" >&2; exit 70 ;;
esac
printf '%s\n' "$fixture" >> "$FIXTURE/reads"
if [ -f "$FIXTURE/$fixture.404" ]; then
  echo 'gh: Not Found (HTTP 404)' >&2
  exit 1
fi
cat "$FIXTURE/$fixture"
MOCK
chmod +x "$work/bin/gh"

check() (
  scope=all
  release_gh() { FIXTURE_THEO=1 gh "$@"; }
  . "$root/scripts/release-settings-check.sh"
)
workflow() { GH_TOKEN=fixture-token sh "$root/scripts/release-environment-check.sh" release; }
expect() {
  code=$1 message=$2
  shift 2
  result=0
  "$@" > "$work/out" 2>&1 || result=$?
  if [ "$result" -ne "$code" ] || ! grep -Fq -- "$message" "$work/out"; then
    cat "$work/out" >&2
    echo "Expected exit $code and message: $message" >&2
    exit 1
  fi
}
edit() { jq "$2" "$work/$1.good" > "$work/$1"; }

expect 2 'RELEASE_SETTINGS_TOKEN is required' env GH_TOKEN= sh "$root/scripts/release-environment-check.sh" release
[ ! -e "$work/reads" ]
expect 0 'facet-ui settings match immutable-releases' check
expect 0 'facet-ui settings match immutable-releases' workflow
: > "$work/reads"
npm_workflow() { GH_TOKEN=fixture-token sh "$root/scripts/release-environment-check.sh" npm; }
expect 0 'facet-ui settings match env-npm' npm_workflow
[ "$(cat "$work/reads")" = "$(printf 'npm\nnpm-policies')" ]
edit npm '.protection_rules += [{type:"required_reviewers", reviewers:[]}]'
expect 1 'npm must have no deployment approval rules' npm_workflow
: > "$work/reads"
expect 0 'facet-ui settings match env-release' workflow
! grep -Eq '^npm' "$work/reads"
cp "$work/npm.good" "$work/npm"
touch "$work/env.404"
expect 1 'environment release is missing (HTTP 404)' check
grep -q 'settings match env-npm' "$work/out"
rm "$work/env.404"

edit main '.rules |= reverse'
edit env '.protection_rules |= reverse'
expect 0 'facet-ui settings match env-release' check
edit main '(.rules[] | select(.type == "required_status_checks").parameters.strict_required_status_checks_policy) = false'
edit repo '.allow_rebase_merge = true | .squash_merge_commit_message = "COMMIT_MESSAGES"'
edit tag '.rules += [{type:"creation"}]'
edit env '.can_admins_bypass = true'
edit policies '.[1].branch_policies += [{name:"v*", type:"tag"}]'
edit immutable '.enabled = false'
edit active '. + [[{id: 99, target:"tag", enforcement:"active"}]]'
expect 1 '+++ live/env-release.json' workflow
for file in ruleset-main ruleset-tag active-tag-rulesets immutable-releases; do
  grep -Fxq "+++ live/$file.json" "$work/out"
done
if grep -Fq 'live/repository-merge.json' "$work/out"; then echo 'workflow compared merge settings' >&2; exit 1; fi
expect 1 '+  "enabled": false' check
grep -Fxq '+++ live/repository-merge.json' "$work/out"

# A read-only token sees no merge settings; the workflow passes, the full check does not.
for fixture in main tag repo env policies active immutable npm npm-policies; do cp "$work/$fixture.good" "$work/$fixture"; done
edit repo '.allow_merge_commit = null | .allow_rebase_merge = null | .allow_squash_merge = null | .squash_merge_commit_title = null | .squash_merge_commit_message = null'
expect 0 'facet-ui settings match immutable-releases' workflow
expect 1 'must use squash merges with the PR title and an empty body' check

for fixture in main tag repo env policies active immutable npm npm-policies; do cp "$work/$fixture.good" "$work/$fixture"; done
edit main 'del(.bypass_actors)'
expect 2 'missing bypass actors for ruleset 27722422' workflow
expect 2 'Administration: Read and Metadata: Read' check
grep -Fq 'missing bypass actors' "$work/out"
cp "$work/main.good" "$work/main"
edit tag 'del(.bypass_actors)'
expect 2 'missing bypass actors for ruleset 27722423' workflow
expect 2 'missing bypass actors for ruleset 27722423' check
cp "$work/tag.good" "$work/tag"
mv "$work/env" "$work/env.missing"
expect 2 'Cannot read facet-ui settings (repos/facet-framework/facet-ui/environments/release)' check
cp "$work/env.good" "$work/env"
printf '%s\n' '{"branch_policies":[]}' > "$work/policies"
expect 2 'facet-ui settings match ruleset-main' workflow

# A release tree can change the expected JSON, but it cannot relax these invariants.
for fixture in main tag repo env policies active immutable npm npm-policies; do cp "$work/$fixture.good" "$work/$fixture"; done
release_tree="$work/release-tree"
mkdir -p "$release_tree/scripts"
cp -R "$settings" "$release_tree/settings"
cp "$root/scripts/release-environment-check.sh" "$root/scripts/release-settings-check.sh" "$release_tree/scripts/"
release_tree_check() { GH_TOKEN=fixture-token sh "$release_tree/scripts/release-environment-check.sh" release; }
edit main '.bypass_actors = [{actor_id: 5, actor_type: "Integration", bypass_mode: "always"}]'
cp "$work/main" "$release_tree/settings/ruleset-main.json"
expect 1 'facet-ui ruleset-main must have no bypass actors' release_tree_check
cp "$work/main.good" "$work/main"
cp "$work/main.good" "$release_tree/settings/ruleset-main.json"
edit tag '.bypass_actors = [{actor_id: 5, actor_type: "Integration", bypass_mode: "always"}]'
cp "$work/tag" "$release_tree/settings/ruleset-tag.json"
expect 1 'facet-ui ruleset-tag must have no bypass actors' release_tree_check
edit tag '.rules += [{type: "creation"}]'
cp "$work/tag" "$release_tree/settings/ruleset-tag.json"
expect 1 'facet-ui v* tags must allow creation' release_tree_check
cp "$work/tag.good" "$work/tag"
cp "$work/tag.good" "$release_tree/settings/ruleset-tag.json"
edit env '.can_admins_bypass = true'
jq '.can_admins_bypass = true' "$settings/env-release.json" > "$release_tree/settings/env-release.json"
expect 1 'facet-ui environment release must allow only main' release_tree_check
echo 'OK: settings drift, unreadable bypass actors, and enforced release invariants'
