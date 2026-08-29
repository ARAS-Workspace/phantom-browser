#!/usr/bin/env bash
set -euo pipefail

DEFAULT_ARCH=arm64
DEFAULT_JOBS=10
TARGET=chrome

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TREE="$ROOT/chromium"
SRC="$TREE/src"

usage() {
    echo "usage: build.sh [arch] [-j N]"
    echo "arch defaults to $DEFAULT_ARCH, -j defaults to $DEFAULT_JOBS, target is $TARGET"
}

die() {
    echo "build: $*" >&2
    exit 1
}

say() {
    echo "build: $*"
}

path_without_virtualenv() {
    local out="" entry
    local IFS=:
    for entry in $PATH; do
        if [ -n "${VIRTUAL_ENV-}" ] && [ "$entry" = "$VIRTUAL_ENV/bin" ]; then
            continue
        fi
        out="${out:+$out:}$entry"
    done
    printf '%s' "$out"
}

arch="$DEFAULT_ARCH"
jobs="$DEFAULT_JOBS"

while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help) usage; exit 0 ;;
        -j) shift; [ $# -gt 0 ] || die "-j needs a number"; jobs="$1" ;;
        -j*) jobs="${1#-j}" ;;
        -*) die "unknown option: $1" ;;
        *) arch="$1" ;;
    esac
    shift
done

case "$jobs" in
    ''|*[!0-9]*) die "-j must be a number, got: $jobs" ;;
esac

out="$SRC/out/$arch"
ninja="$SRC/third_party/ninja/ninja"

[ -f "$out/build.ninja" ] || die "no build files in $out, run 'sync.sh configure' first"
[ -x "$ninja" ] || die "no ninja at $ninja, the deps stage has not finished"

started=$SECONDS
say "building $TARGET for $arch with -j $jobs"
say "started at $(date '+%Y-%m-%d %H:%M:%S')"

( cd "$SRC" && env -u VPYTHON_BYPASS -u VIRTUAL_ENV -u PYTHONPATH -u PYTHONHOME \
    PATH="$TREE/.staging/depot_tools:$(path_without_virtualenv)" \
    "$ninja" -C "out/$arch" -j "$jobs" "$TARGET" )

app="$out/Chromium.app"
[ -d "$app" ] || die "ninja finished but there is no app at $app"

binary="$app/Contents/MacOS/Chromium"
[ -x "$binary" ] || die "the app has no executable at $binary"
version="$("$binary" --version 2>&1 | head -1)"
[ -n "$version" ] || die "the built binary did not answer --version"

elapsed=$(( SECONDS - started ))
say "built $version"
say "done in ${elapsed}s ($(( elapsed / 60 ))m) with -j $jobs, out/$arch is $(du -sh "$out" 2>/dev/null | cut -f1)"
