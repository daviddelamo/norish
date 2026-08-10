#!/usr/bin/env bash
# Prove that the Obscura image a Norish release points at actually exists, and
# that every active surface points at the same one.
#
#   ./docker/obscura/verify-pin.sh                  # references only (no network)
#   ./docker/obscura/verify-pin.sh --registry       # references and the published manifest
#   ./docker/obscura/verify-pin.sh --registry-only  # just the manifest
#
# Run from anywhere inside the repository. The release workflows run it with
# --registry before they tag or publish, so a Compose example can never quote an
# image tag that was never pushed. The publish workflow runs --registry-only,
# because publishing a bumped pin necessarily happens before the Compose
# surfaces are moved to it.
#
# Sticks to POSIX-ish shell so it behaves the same on a maintainer's macOS bash
# 3.2 as on a CI runner's bash 5.
set -euo pipefail

check_refs=1
check_registry=0
case "${1:-}" in
"") ;;
--registry) check_registry=1 ;;
--registry-only)
    check_refs=0
    check_registry=1
    ;;
*)
    echo "Usage: verify-pin.sh [--registry | --registry-only]" >&2
    exit 2
    ;;
esac

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"

set -a
# shellcheck source=/dev/null
. "$here/pin.env"
set +a

: "${OBSCURA_IMAGE:?pin.env must define OBSCURA_IMAGE}"
: "${OBSCURA_IMAGE_TAG:?pin.env must define OBSCURA_IMAGE_TAG}"
: "${OBSCURA_REVISION:?pin.env must define OBSCURA_REVISION}"
: "${OBSCURA_SHA256_AMD64:?pin.env must define OBSCURA_SHA256_AMD64}"
: "${OBSCURA_SHA256_ARM64:?pin.env must define OBSCURA_SHA256_ARM64}"

# Registry-qualified in pin.env so `docker buildx imagetools` is unambiguous;
# Compose files write the short form Docker Hub users recognise.
short_image="${OBSCURA_IMAGE#docker.io/}"
pinned="${short_image}:${OBSCURA_IMAGE_TAG}"

echo "Obscura pin: ${pinned} (upstream ${OBSCURA_VERSION:-?} @ ${OBSCURA_REVISION})"

# Everything excluded here is a record of a past release or of work in
# progress, not configuration anyone deploys. Release notes matter as much as
# the frozen docs: a shipped release's upgrade instructions name the tag *that*
# release shipped, and rewriting them to match a later pin would be a lie.
scan() {
    git -C "$repo" grep "$@" -- \
        ':!.scratch' \
        ':!apps/docs/versioned_docs' \
        ':!apps/docs/docs/release-notes'
}

status=0

# The Dockerfile carries the same revision as ARG defaults so a bare
# `docker build docker/obscura` works. Defaults that drift from pin.env would
# make this file's claim to be the single record false, so they are checked
# rather than trusted to a comment.
for var in OBSCURA_REPO OBSCURA_REVISION OBSCURA_VERSION OBSCURA_SHA256_AMD64 OBSCURA_SHA256_ARM64; do
    eval "expected=\$$var"
    actual="$(sed -n "s/^ARG ${var}=//p" "$here/Dockerfile" | head -1)"
    if [ "$actual" != "$expected" ]; then
        echo "Dockerfile's ARG ${var}=${actual:-<unset>} does not match pin.env's ${expected}." >&2
        status=1
    fi
done
[ $status -eq 0 ] || exit $status

if [ $check_refs -eq 1 ]; then
    refs="$(scan -hoE "${short_image}:[A-Za-z0-9_.-]+" | sort -u)"

    if [ -z "$refs" ]; then
        echo "No active surface references ${short_image}. Expected the Compose examples to." >&2
        exit 1
    fi

    count=0
    while IFS= read -r ref; do
        [ -n "$ref" ] || continue
        count=$((count + 1))
        [ "$ref" = "$pinned" ] && continue

        echo "Reference '${ref}' does not match the pin '${pinned}':" >&2
        scan -nF "$ref" >&2
        status=1
    done <<EOF
$refs
EOF

    [ $status -eq 0 ] || exit $status

    echo "All ${count} distinct reference(s) match the pin."
fi

if [ $check_registry -eq 0 ]; then
    exit 0
fi

echo "Inspecting ${OBSCURA_IMAGE}:${OBSCURA_IMAGE_TAG} ..."
manifest="$(docker buildx imagetools inspect --raw "${OBSCURA_IMAGE}:${OBSCURA_IMAGE_TAG}")"

# Both architectures or nothing: a manifest missing arm64 is the one thing
# push-by-digest gets quietly wrong, and ARM operators would find out on pull.
for platform in linux/amd64 linux/arm64; do
    os="${platform%%/*}"
    arch="${platform##*/}"
    if ! printf '%s' "$manifest" | tr -d ' \n' |
        grep -qE "\"os\":\"${os}\"[^}]*\"architecture\":\"${arch}\"|\"architecture\":\"${arch}\"[^}]*\"os\":\"${os}\""; then
        echo "Published manifest has no ${platform} variant." >&2
        status=1
    fi
done

[ $status -eq 0 ] || exit $status

echo "Published manifest covers linux/amd64 and linux/arm64."
