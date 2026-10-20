#!/bin/sh
set -eu

CDPATH= cd -P "$(dirname "$0")/.." || exit 2

snapshot_dir=$(mktemp -d "${TMPDIR:-/tmp}/fast-check-build-compare.XXXXXX") || exit 2
keep_snapshot=false

cleanup() {
  if [ "$keep_snapshot" = false ]; then
    rm -rf "$snapshot_dir"
  fi
}
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM

snapshot_outputs() {
  mkdir -p "$1/packages" || return 2
  for output in packages/*/lib; do
    [ -d "$output" ] || continue
    mkdir -p "$1/${output%/*}" || return 2
    cp -R "$output" "$1/$output" || return 2
  done
}

# Rolldown cleans lib during the build, so copy the old output first.
has_previous=false
for output in packages/*/lib; do
  if [ -d "$output" ]; then
    has_previous=true
    break
  fi
done
snapshot_outputs "$snapshot_dir/previous" || exit 2

if ! pnpm build; then
  keep_snapshot=true
  printf 'Build failed; comparison skipped. Previous output saved at: %s\n' "$snapshot_dir/previous" >&2
  exit 2
fi

if [ "$has_previous" = false ]; then
  printf '%s\n' 'No previous build output found. Build completed; run pnpm build:compare again to compare against it.'
  exit 0
fi

snapshot_outputs "$snapshot_dir/current" || exit 2

# Git handles added/deleted files (including empty files) and prints unified diffs.
status=0
git -C "$snapshot_dir" --no-pager diff --no-index --no-ext-diff --no-textconv --no-renames \
  --src-prefix= --dst-prefix= -- previous current || status=$?

case "$status" in
  0) printf '%s\n' 'Build output is identical to the previous build.' ;;
  1) printf '%s\n' 'Build output differs from the previous build.' ;;
  *)
    keep_snapshot=true
    printf 'Comparison failed. Snapshots saved at: %s\n' "$snapshot_dir" >&2
    exit 2
    ;;
esac
exit "$status"
