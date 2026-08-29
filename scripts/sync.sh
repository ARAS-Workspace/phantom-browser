#!/usr/bin/env bash
set -euo pipefail

STAGES="verify source deps"

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

stage_deps() {
    local started=$SECONDS
    local staging="$TREE/.staging"
    local dt="$staging/depot_tools"
    local marker="$staging/deps-synced-at"
    local head dt_commit

    [ -d "$SRC/.git" ] || die "the source stage has not run, there is no tree at $SRC"
    head="$(git -C "$SRC" rev-parse HEAD)"

    if [ -f "$marker" ] && [ "$(cat "$marker")" = "$head" ]; then
        say "deps already synced for $head, nothing to do"
        return 0
    fi

    dt_commit="$(sed -n "s|.*depot_tools\.git' + '@' + '\([0-9a-f]\{40\}\)'.*|\1|p" "$SRC/DEPS" | head -1)"
    [ -n "$dt_commit" ] || die "could not read the depot_tools commit out of $SRC/DEPS"
    say "depot_tools pinned by DEPS at $dt_commit"

    mkdir -p "$staging"
    if [ ! -d "$dt/.git" ]; then
        rm -rf "$dt"
        mkdir -p "$dt"
        git -C "$dt" init -q
        git -C "$dt" remote add origin \
            "https://chromium.googlesource.com/chromium/tools/depot_tools"
    fi
    git -C "$dt" fetch --depth=1 origin "$dt_commit"
    git -C "$dt" reset --hard "$dt_commit"
    git -C "$dt" clean -ffdx

    if [ -e "$ROOT/src" ]; then
        die "a stray $ROOT/src exists, left by a sync that used the wrong layout; remove it and run again"
    fi

    cat > "$TREE/.gclient" <<EOF
solutions = [
  {
    "name": "src",
    "url": "https://chromium.googlesource.com/chromium/src.git",
    "managed": False,
    "custom_deps": {},
    "custom_vars": {
      "checkout_configuration": "small",
    },
  },
];
target_os = ['mac'];
target_os_only = True;
target_cpu = ['arm64', 'x64'];
target_cpu_only = True;
EOF

    say "running gclient sync with hooks, this brings chromium's own toolchain"
    ( cd "$TREE" && env -u VPYTHON_BYPASS -u VIRTUAL_ENV -u PYTHONPATH -u PYTHONHOME \
        GCLIENT_FILE="$TREE/.gclient" \
        DEPOT_TOOLS_UPDATE=0 \
        PYTHONDONTWRITEBYTECODE=1 \
        PATH="$dt:$(path_without_virtualenv)" \
        "$dt/gclient" sync -f -D -R --no-history )

    local clang="$SRC/third_party/llvm-build/Release+Asserts/bin/clang"
    [ -x "$clang" ] || die "gclient finished but chromium's own clang is not at $clang"
    say "chromium's own clang is in place: $("$clang" --version | head -1)"

    printf '%s' "$head" > "$marker"
    report deps "$started"
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
