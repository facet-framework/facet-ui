#!/bin/sh
# Simulate npm responses without registry credentials or network writes.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
trap 'exit 1' HUP INT TERM
export TMPDIR="$work" FIXTURE="$work" PATH="$work/bin:$PATH"
mkdir "$work/bin" "$work/package" "$work/dist"
cd "$work"

cat > "$work/bin/npm" <<'MOCK'
#!/bin/sh
set -eu
case "$1 $2" in
  "view @facet-tools/ui@$VERSION")
    [ "$* $#" = "view @facet-tools/ui@$VERSION dist.integrity --registry https://registry.npmjs.org 5" ]
    case "$STATE" in
      published) cat "$FIXTURE/integrity" ;;
      different) echo 'sha512-different' ;;
      empty) exit 0 ;;
      offline) echo 'npm error code E503' >&2; exit 1 ;;
      *) echo 'npm error code E404' >&2; exit 1 ;;
    esac
    ;;
  'stage publish')
    [ "$* $#" = "stage publish ./facet-tools-ui-$VERSION.tgz --access public --provenance --tag $DIST_TAG --registry https://registry.npmjs.org 10" ]
    printf '%s\n' "$DIST_TAG" >> "$FIXTURE/stages"
    case "$STATE" in
      missing) ;;
      pending) printf 'npm error code E409\nnpm error Cannot publish over previously staged version\n' >&2; exit 1 ;;
      conflict) printf 'npm error code E409\nnpm error Other conflict\n' >&2; exit 1 ;;
      *) exit 70 ;;
    esac
    ;;
  *) exit 70 ;;
esac
MOCK
chmod +x "$work/bin/npm"

fixture() {
  export VERSION=$1 DIST_TAG=$2
  printf '{"name":"%s","version":"%s"}\n' "${3:-@facet-tools/ui}" "$VERSION" > package/package.json
  tarball="facet-tools-ui-$VERSION.tgz"
  tar -czf "dist/$tarball" package/package.json
  (cd dist && sha256sum -- "$tarball" > checksums.txt)
  hash=$(openssl dgst -sha512 -binary "dist/$tarball" | openssl base64 -A)
  printf 'sha512-%s\n' "$hash" > integrity
}

expect() {
  export STATE=$1
  code=$2 message=$3
  result=0
  sh "$root/scripts/release-npm-publish.sh" "$VERSION" dist > outcome 2>&1 || result=$?
  if [ "$result" -ne "$code" ] || ! grep -Fq "$message" outcome; then
    cat outcome >&2
    printf 'Expected exit %s and message: %s\n' "$code" "$message" >&2
    exit 1
  fi
}

fixture 0.1.0-rc.3 latest
expect published 0 'already published with this tarball; skipped'
expect different 2 'different or missing integrity'
expect empty 2 'different or missing integrity'
expect offline 2 'cannot query'
[ ! -e stages ]
expect missing 0 'staged with dist-tag latest'
expect pending 0 'awaiting approval on npmjs.com'
expect conflict 2 'cannot stage'
fixture 0.0.9-rc.1 latest
expect missing 0 'staged with dist-tag latest'
fixture 0.1.0 latest
expect missing 0 'staged with dist-tag latest'
fixture 0.1.1-rc.1 next
expect missing 0 'staged with dist-tag next'
fixture 1.0.0 latest
expect missing 0 'staged with dist-tag latest'
fixture 1.0.0 latest @example/other
expect missing 2 'tarball manifest does not describe'
printf 'tampered\n' >> "dist/$tarball"
expect missing 2 'checksum does not match'
[ "$(wc -l < stages)" -eq 7 ]
echo 'OK: npm dist-tags, integrity, conflicts and approval status'
