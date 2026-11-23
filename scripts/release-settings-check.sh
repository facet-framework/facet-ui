# Shared settings validation. The entry point supplies root, scope and release_gh.
repo=facet-framework/facet-ui
endpoint="repos/$repo"

api() {
  release_gh api --hostname github.com --method GET "$@"
}

unreadable() {
  printf 'Cannot read facet-ui settings (%s). Use a repository-scoped token with Administration: Read and Metadata: Read.\n' "$*" >&2
  exit 2
}

scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
trap 'exit 2' HUP INT TERM
drift=0

invariant() {
  if ! printf '%s\n' "$2" | jq -e "$3" >/dev/null; then
    printf 'facet-ui %s\n' "$1" >&2
    drift=1
  fi
}

compare() {
  canonical='walk(if type == "array" then sort else . end)'
  jq -eS "$canonical" "$root/settings/$1.json" > "$scratch/expected" || exit 2
  printf '%s\n' "$2" | jq -eS "$canonical" > "$scratch/live" || exit 2
  if diff -u -L "expected/$1.json" -L "live/$1.json" "$scratch/expected" "$scratch/live"; then
    printf 'facet-ui settings match %s\n' "$1"
  else
    [ "$?" -eq 1 ] || exit 2
    drift=1
  fi
}

ruleset() {
  response=$(api "$endpoint/rulesets/$2") || unreadable "$endpoint/rulesets/$2"
  actual=$(printf '%s' "$response" | jq -ce '
    select((.rules | type) == "array")
    | {name, target, enforcement, bypass_actors, conditions, rules}') ||
    unreadable "ruleset $2"
  if ! printf '%s' "$actual" | jq -e '(.bypass_actors | type) == "array"' >/dev/null; then
    unreadable "missing bypass actors for ruleset $2"
  fi
  invariant "$1 must have no bypass actors" "$actual" '.bypass_actors == []'
  invariant "$1 must be active" "$actual" '.enforcement == "active"'
  case "$1" in
    ruleset-main)
      invariant 'main must require a reviewed squash PR and strict CI' "$actual" '
        .target == "branch" and .conditions.ref_name == {include: ["~DEFAULT_BRANCH"], exclude: []}
        and (["deletion", "non_fast_forward"] - [.rules[].type]) == []
        and any(.rules[]; .type == "pull_request"
          and (.parameters.required_approving_review_count | type) == "number"
          and .parameters.required_approving_review_count >= 1
          and .parameters.dismiss_stale_reviews_on_push == true
          and .parameters.allowed_merge_methods == ["squash"])
        and any(.rules[]; .type == "required_status_checks"
          and .parameters.strict_required_status_checks_policy == true
          and .parameters.do_not_enforce_on_create == false
          and .parameters.required_status_checks == [{context: "check", integration_id: 15368}])'
      ;;
    ruleset-tag)
      invariant 'v* tags must allow creation and restrict updates and deletion' "$actual" '
        .target == "tag" and .conditions.ref_name == {include: ["refs/tags/v*"], exclude: []}
        and ([.rules[].type] | sort) == ["deletion", "non_fast_forward", "update"]'
      ;;
  esac
  compare "$1" "$actual"
}

environment() {
  env_name=$1
  url="$endpoint/environments/$env_name"
  if ! response=$(api "$url" 2>"$scratch/api-error"); then
    if grep -Eq '\(HTTP 404\)$' "$scratch/api-error"; then
      printf 'facet-ui environment %s is missing (HTTP 404)\n' "$env_name" >&2
      drift=1
      return
    fi
    cat "$scratch/api-error" >&2
    unreadable "$url"
  fi
  policies=$(api --paginate --slurp "$url/deployment-branch-policies?per_page=100") ||
    unreadable "$url/deployment-branch-policies"
  branch_policies=$(printf '%s' "$policies" | jq -ce '
    select(type == "array" and length > 0 and all(.[]; (.branch_policies | type) == "array"))
    | [.[].branch_policies[] | {name, type}]') || unreadable "$url/deployment-branch-policies"
  actual=$(printf '%s' "$response" | jq -ce --argjson branch_policies "$branch_policies" '
    select((.protection_rules | type) == "array")
    | {can_admins_bypass, deployment_branch_policy,
       protection_rules: [.protection_rules[] | del(.id, .node_id)
         | if .type == "required_reviewers" then .reviewers |= map({type, id: .reviewer.id}) else . end],
       branch_policies: $branch_policies}') || unreadable "$url"
  invariant "environment $env_name must allow only main with administrator bypass disabled" "$actual" '
    .can_admins_bypass == false
    and .deployment_branch_policy == {protected_branches: false, custom_branch_policies: true}
    and .branch_policies == [{name: "main", type: "branch"}]'
  case "$env_name" in
    release)
      invariant 'release must require approval from the release owner' "$actual" '
        (.protection_rules | sort_by(.type)) == [{type: "branch_policy"},
          {type: "required_reviewers", prevent_self_review: false, reviewers: [{type: "User", id: 11357019}]}]'
      ;;
    npm)
      invariant 'npm must have no deployment approval rules' "$actual" '
        .protection_rules == [{type: "branch_policy"}]'
      ;;
  esac
  compare "env-$env_name" "$actual"
}

if [ "$scope" != npm ]; then
  ruleset ruleset-main 27722422
  ruleset ruleset-tag 27722423
  url="$endpoint/rulesets?targets=tag&includes_parents=true&per_page=100"
  response=$(api --paginate --slurp "$url") || unreadable "$url"
  active_tag_rulesets=$(printf '%s' "$response" | jq -ce '
    select(type == "array" and length > 0 and all(.[]; type == "array"))
    | [.[][] | select(.enforcement == "active") | .id]') || unreadable "$url"
  invariant 'must have only the expected active tag ruleset' "$active_tag_rulesets" '. == [27722423]'
  compare active-tag-rulesets "$active_tag_rulesets"

  response=$(api "$endpoint") || unreadable "$endpoint"
  actual=$(printf '%s' "$response" | jq -ce --arg repo "$repo" '
    select(.full_name == $repo and .visibility == "public")
    | {default_branch, allow_merge_commit, allow_rebase_merge, allow_squash_merge,
       squash_merge_commit_title, squash_merge_commit_message}') || unreadable "$endpoint"
  invariant 'must use squash merges with the PR title and an empty body' "$actual" '
    . == {default_branch: "main", allow_merge_commit: false, allow_rebase_merge: false,
      allow_squash_merge: true, squash_merge_commit_title: "PR_TITLE", squash_merge_commit_message: "BLANK"}'
  compare repository-merge "$actual"

  environment release

  response=$(api "$endpoint/immutable-releases") || unreadable "$endpoint/immutable-releases"
  actual=$(printf '%s' "$response" | jq -ce '{enabled}') || unreadable "$endpoint/immutable-releases"
  invariant 'must enable immutable releases' "$actual" '.enabled == true'
  compare immutable-releases "$actual"
fi
if [ "$scope" != release ]; then
  environment npm
fi
exit "$drift"
