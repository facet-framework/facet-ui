#!/bin/sh
# Exercise the package handoff through a simulated GitHub draft and release.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
trap 'exit 1' HUP INT TERM
export TMPDIR="$work" FIXTURE="$work" PATH="$work/bin:$PATH"
export GH_TOKEN=fixture VERSION=0.1.0-rc.3 REPO=example/facet-ui
export TARBALL="facet-tools-ui-$VERSION.tgz" PRERELEASE=true
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null
export GIT_AUTHOR_NAME=Fixture GIT_AUTHOR_EMAIL=fixture@example.invalid
export GIT_COMMITTER_NAME=Fixture GIT_COMMITTER_EMAIL=fixture@example.invalid
mkdir "$work/bin" "$work/out" "$work/source" "$work/remote-assets"
cd "$work"
printf '# Release notes\n' > CHANGELOG.md
printf '{"name":"@facet-tools/ui","version":"%s"}\n' "$VERSION" > source/package.json
git -C source init -q
git -C source add package.json
git -C source commit -qm 'Tagged source'
export SOURCE_SHA
SOURCE_SHA=$(git -C source rev-parse HEAD)
printf 'Tarball fixture\n' > "out/$TARBALL"
(cd out && sha256sum -- "$TARBALL" > checksums.txt)

cat > "$work/bin/gh" <<'MOCK'
#!/bin/sh
set -eu
[ "$GH_TOKEN" = fixture ]
if [ "$1 $2" = 'attestation verify' ]; then
  [ "$3" = "download/$TARBALL" ] && [ "$4 $5 $6 $7" = "--repo $REPO --signer-workflow $REPO/.github/workflows/release.yml" ]
  [ "$8 $9 ${10} ${11}" = "--source-digest $SOURCE_SHA --source-ref refs/heads/main" ]
  echo verify-attestation >> "$FIXTURE/reads"
  [ ! -f "$FIXTURE/invalid-attestation" ] || exit 72
  exit 0
fi
[ "$1" = release ] && [ "$3" = "v$VERSION" ]
operation=$2
shift 3
state=$(cat "$FIXTURE/state")
case "$operation" in
  view)
    [ "$# $1 $2 $3" = "4 --repo $REPO --json" ]
    case "$state" in
      absent) echo 'release not found' >&2; exit 1 ;;
      unavailable) echo 'Resource not accessible (HTTP 403)' >&2; exit 1 ;;
    esac
    case "$4" in
      isDraft,isImmutable,tagName)
        jq -n --arg tag "v$VERSION" --arg state "$state" '
          {tagName:$tag,isDraft:($state=="draft"),isImmutable:($state=="immutable")}'
        ;;
      isDraft,tagName,assets)
        [ ! -f "$FIXTURE/read-failure" ] || exit 71
        jq -n --arg tag "v$VERSION" --arg state "$state" --rawfile names "$FIXTURE/assets" '
          {tagName:$tag,isDraft:($state=="draft"),
           assets:($names|split("\n")|map(select(length>0)|{name:.}))}'
        ;;
      *) exit 70 ;;
    esac
    ;;
  create)
    [ "$state $#" = 'absent 9' ]
    [ "$1 $2 $3 $4 $5" = "--repo $REPO --verify-tag --draft --prerelease=$PRERELEASE" ]
    [ "$6 $7 $8 $9" = "--title FACET UI $VERSION --notes-file CHANGELOG.md" ]
    echo create >> "$FIXTURE/writes"
    echo draft > "$FIXTURE/state"
    ;;
  upload)
    [ "$state $#" = 'draft 5' ]
    [ "$1 $2 $3 $4 $5" = "out/$TARBALL out/checksums.txt --repo $REPO --clobber" ]
    echo upload >> "$FIXTURE/writes"
    [ ! -f "$FIXTURE/upload-failure" ] || { echo 'Simulated upload failure' >&2; exit 72; }
    cp "$1" "$2" "$FIXTURE/remote-assets"
    printf '%s\n' checksums.txt > "$FIXTURE/assets"
    if [ ! -f "$FIXTURE/missing-asset" ]; then
      printf '%s\n' "$TARBALL" >> "$FIXTURE/assets"
    fi
    ;;
  edit)
    [ "$state $#" = 'draft 8' ]
    [ "$1 $2 $3 $4 $5 $6 $7 $8" = "--repo $REPO --prerelease=$PRERELEASE --title FACET UI $VERSION --notes-file CHANGELOG.md --draft=false" ]
    echo publish >> "$FIXTURE/writes"
    echo immutable > "$FIXTURE/state"
    ;;
  download)
    [ "$state $#" = 'immutable 8' ]
    [ "$1 $2 $3" = "--repo $REPO --dir" ]
    [ "$5 $6 $7 $8" = "--pattern $TARBALL --pattern checksums.txt" ]
    mkdir -p "$4"
    cp "$FIXTURE/remote-assets/$TARBALL" "$FIXTURE/remote-assets/checksums.txt" "$4"
    ;;
  *) exit 70 ;;
esac
MOCK
chmod +x "$work/bin/gh"

publish() { sh "$root/scripts/release-publish.sh" "$VERSION" "$REPO" out; }
download() {
  rm -rf -- download
  sh "$root/scripts/release-npm-assets.sh" "v$VERSION" "$REPO" source download
}
expect() {
  wanted=$1 message=$2
  shift 2
  result=0
  "$@" > "$work/outcome" 2>&1 || result=$?
  if [ "$result" -ne "$wanted" ] || ! grep -Fq "$message" "$work/outcome"; then
    cat "$work/outcome" >&2
    printf 'Expected exit %s and message: %s\n' "$wanted" "$message" >&2
    exit 1
  fi
}

echo unavailable > state
expect 2 'cannot read release' publish
mv out/checksums.txt saved-checksums
expect 2 'expected facet-tools-ui-' publish
cp saved-checksums out/checksums.txt
printf 'unexpected entry\n' >> out/checksums.txt
expect 2 'checksum does not match' publish
cp saved-checksums out/checksums.txt
[ ! -e writes ]
echo absent > state
touch upload-failure
expect 72 'Simulated upload failure' publish
[ "$(cat state)" = draft ]
rm upload-failure
expect 2 'expected a published immutable release' download
touch missing-asset
expect 2 'does not contain exactly the expected assets' publish
rm missing-asset
touch read-failure
expect 2 'cannot verify uploaded assets' publish
rm read-failure
publish
expect 0 'already has these published assets' publish
[ "$(cat writes)" = "$(printf 'create\nupload\nupload\nupload\nupload\npublish')" ]
download
[ "$(cat reads)" = verify-attestation ]
touch invalid-attestation
result=0
download || result=$?
[ "$result" -eq 72 ]
rm invalid-attestation
printf 'changed\n' >> "remote-assets/$TARBALL"
expect 2 'different published assets' publish
expect 2 'checksum does not match' download
[ "$(wc -l < reads)" -eq 2 ]
printf '{"name":"@facet-tools/ui","version":"0.1.0"}\n' > source/package.json
expect 2 'source package does not match' download
echo 'OK: release assets, draft retry, immutable publication and attestation verification'
