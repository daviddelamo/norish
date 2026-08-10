# syntax=docker/dockerfile:1.7

# Norish's own image of Obscura (https://github.com/h4ckf0r0day/obscura), the
# headless browser that renders pages for URL imports.
#
# Why not upstream's image: its Dockerfile builds `--features render` only, so
# the binary inside accepts `--stealth` but has no stealth transport compiled
# in — the TLS fingerprint stays wrong however the process is started. Upstream
# publishes four release archives per platform, and the `-stealth` one is the
# render+stealth build; that is what this takes.
#
# Why an image of our own at all: so a Norish release can name the exact browser
# it ships. The archive is pinned by SHA-256, not just by version, because
# release assets can be replaced in place.
#
# The defaults below mirror docker/obscura/pin.env, which is the record the
# release workflow reads; `verify-pin.sh` fails if the two drift.

ARG OBSCURA_REPO=https://github.com/h4ckf0r0day/obscura
ARG OBSCURA_VERSION=0.2.0
ARG OBSCURA_REVISION=97124edeb2ea610615e78f43e097454e3b221f6b
ARG OBSCURA_SHA256_AMD64=4b0fe0ff32a2e17e33b1e3d67bfb06e8f4d875bdffa86aa766277232422dfde7
ARG OBSCURA_SHA256_ARM64=d9b55448043815872d6fdc9d51aca7efd4055abff41fe3dd3fb512718c746bee

# Only here to fetch and verify: the runtime image below has no shell to do it in.
FROM debian:12-slim AS fetch

ARG OBSCURA_REPO
ARG OBSCURA_VERSION
ARG OBSCURA_REVISION
ARG OBSCURA_SHA256_AMD64
ARG OBSCURA_SHA256_ARM64
ARG TARGETARCH

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /out

# Upstream names architectures the way uname does; Docker does not. An
# unrecognised TARGETARCH fails the build rather than quietly producing an
# image with no browser in it.
RUN set -eux; \
    case "$TARGETARCH" in \
    amd64) arch=x86_64; sha="$OBSCURA_SHA256_AMD64" ;; \
    arm64) arch=aarch64; sha="$OBSCURA_SHA256_ARM64" ;; \
    *) echo "No Obscura release build for TARGETARCH=$TARGETARCH" >&2; exit 1 ;; \
    esac; \
    curl -fsSL -o obscura.tar.gz \
    "${OBSCURA_REPO}/releases/download/v${OBSCURA_VERSION}/obscura-${arch}-linux-stealth.tar.gz"; \
    echo "${sha}  obscura.tar.gz" | sha256sum -c -; \
    tar xzf obscura.tar.gz obscura obscura-worker; \
    rm obscura.tar.gz

# Apache-2.0 requires the licence travel with the work. Fetched at the pinned
# commit rather than the tag, because tags move and this one is evidence.
RUN set -eux; \
    raw="https://raw.githubusercontent.com/h4ckf0r0day/obscura/${OBSCURA_REVISION}"; \
    curl -fsSL -o LICENSE "${raw}/LICENSE"; \
    curl -fsSL -o README.md "${raw}/README.md"

# distroless/cc: glibc, libgcc and CA certs, no shell and no package manager.
# The release binaries need exactly libc, libgcc_s and libm, and are built
# against glibc 2.35; this base carries 2.36.
FROM gcr.io/distroless/cc-debian12

ARG OBSCURA_REPO
ARG OBSCURA_VERSION
ARG OBSCURA_REVISION

LABEL org.opencontainers.image.title="Norish Obscura" \
      org.opencontainers.image.description="Obscura headless browser, the render+stealth release build, as shipped by Norish for URL imports." \
      org.opencontainers.image.version="${OBSCURA_VERSION}" \
      org.opencontainers.image.revision="${OBSCURA_REVISION}" \
      org.opencontainers.image.source="${OBSCURA_REPO}" \
      org.opencontainers.image.url="https://github.com/norish-recipes/Norish" \
      org.opencontainers.image.licenses="Apache-2.0"

COPY --from=fetch /out/obscura /obscura
COPY --from=fetch /out/obscura-worker /obscura-worker

# Upstream ships no NOTICE file; its README carries the credits.
COPY --from=fetch /out/LICENSE /licenses/obscura/LICENSE
COPY --from=fetch /out/README.md /licenses/obscura/README.md

EXPOSE 9222

# The whole command is the entrypoint, so stealth is a property of the image
# rather than of however an operator starts it. `--host 0.0.0.0` is what makes
# the port reachable from the Norish container; the binary's own default is
# loopback-only.
#
# Deliberately absent: `--allow-private-network`. Obscura blocks loopback,
# RFC1918 and link-local targets by default — including at DNS resolution time —
# and that default is what keeps an authenticated URL import from reaching the
# deployment's own network.
ENTRYPOINT ["/obscura", "serve", "--host", "0.0.0.0", "--port", "9222", "--stealth"]
