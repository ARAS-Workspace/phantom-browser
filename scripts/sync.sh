#!/usr/bin/env bash
set -euo pipefail

STAGES="verify source"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PINS="$ROOT/config/pins"
TREE="$ROOT/chromium"
SRC="$TREE/src"
CHROMIUM_REMOTE="https://chromium.googlesource.com/chromium/src"

usage() {
    echo "usage: sync.sh [stage...]"
    echo "stages: $STAGES"
    echo "no stage runs them all, in order"
}

die() {
    echo "sync: $*" >&2
    exit 1
}

say() {
    echo "sync: $*"
}

pin() {
    local key="$1" pattern value
    pattern="$(printf '%s' "$key" | sed 's|\.|\\.|g')"
    value="$(sed -n "s|^${pattern} = ||p" "$PINS" | head -1)"
    [ -n "$value" ] || die "pin not found: $key"
    printf '%s' "$value"
}

report() {
    local stage="$1" started="$2"
    local elapsed=$(( SECONDS - started ))
    local size="-"
    [ -d "$TREE" ] && size="$(du -sh "$TREE" 2>/dev/null | cut -f1)"
    say "$stage done in ${elapsed}s, chromium/ is $size"
}

stage_verify() {
    "$ROOT/tools/verify-pins" "$PINS"
}

stage_source() {
    local started=$SECONDS
    local version commit head
    version="$(pin chromium.version)"
    commit="$(pin chromium.commit)"

    if [ -e "$SRC" ] && [ ! -d "$SRC/.git" ]; then
        die "$SRC exists but is not a git checkout, most likely an interrupted clone; remove it with 'rm -rf $TREE' and run again"
    fi

    if [ -d "$SRC/.git" ]; then
        head="$(git -C "$SRC" rev-parse HEAD)"
        if [ "$head" = "$commit" ]; then
            say "source already at $version ($commit), nothing to do"
            return 0
        fi
        say "source is at $head, moving to $version ($commit)"
        git -C "$SRC" fetch origin tag "$version" --depth=2
        git -C "$SRC" reset --hard FETCH_HEAD
    else
        say "cloning chromium $version (depth 2)"
        mkdir -p "$TREE"
        git clone -c advice.detachedHead=false -b "$version" --depth=2 \
            "$CHROMIUM_REMOTE" "$SRC"
    fi

    head="$(git -C "$SRC" rev-parse HEAD)"
    [ "$head" = "$commit" ] || die "source is $head but the pin says $commit"
    say "source verified at $commit"
    report source "$started"
}

run_stage() {
    case " $STAGES " in
        *" $1 "*) ;;
        *) die "unknown stage: $1 (known: $STAGES)" ;;
    esac
    "stage_$1"
}

case "${1-}" in
    -h|--help) usage; exit 0 ;;
esac

[ -f "$PINS" ] || die "no pin file at $PINS"

if [ $# -eq 0 ]; then
    for stage in $STAGES; do run_stage "$stage"; done
else
    for stage in "$@"; do run_stage "$stage"; done
fi
