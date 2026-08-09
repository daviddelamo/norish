# syntax=docker/dockerfile:1.7

# Norish's own build of Obscura (https://github.com/h4ckf0r0day/obscura), the
# headless browser that renders pages for URL imports.
#
# Two things separate this from `h4ckf0r0day/obscura`:
#
#   1. `--features render,stealth`. Upstream's Dockerfile builds `render` only,
#      so its image accepts `--stealth` but has no stealth transport compiled
#      in — the TLS fingerprint stays wrong however the process is started.
#      Stealth is a build-time feature *and* a runtime flag; this image has both.
#   2. A pinned source revision. Upstream tags move to `latest`; Norish releases
#      have to be able to prove which browser source they shipped.
#
# The defaults below mirror docker/obscura/pin.env, which is the record the
# release workflow reads. Keep them in step.

ARG OBSCURA_REPO=https://github.com/h4ckf0r0day/obscura.git
ARG OBSCURA_REVISION=97124edeb2ea610615e78f43e097454e3b221f6b
ARG OBSCURA_VERSION=0.2.0

# Pinned rather than `rust:1`: a floating toolchain would let two builds of the
# same Obscura revision produce different binaries.
FROM rust:1.97.1-slim-bookworm AS builder

ARG OBSCURA_REPO
ARG OBSCURA_REVISION
ARG OBSCURA_VERSION

# cmake/clang/libclang are what the stealth feature's TLS stack needs; the rest
# is the ordinary Rust build toolchain.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        clang \
        cmake \
        curl \
        git \
        libclang-dev \
        llvm-dev \
        make \
        perl \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Fetch the one revision by hash instead of cloning a branch, then assert we
# landed on it: a moved tag or a redirected repo fails the build rather than
# silently shipping different browser source.
RUN git init -q . \
    && git remote add origin "${OBSCURA_REPO}" \
    && git fetch -q --depth 1 origin "${OBSCURA_REVISION}" \
    && git checkout -q --detach FETCH_HEAD \
    && test "$(git rev-parse HEAD)" = "${OBSCURA_REVISION}"

# OBSCURA_VERSION is read by obscura-cli's build script and stamped into
# `obscura --version`; without it the binary reports the workspace's 0.1.0.
ENV OBSCURA_VERSION=${OBSCURA_VERSION}
RUN cargo build --release -p obscura-cli --bins --features render,stealth \
    && mkdir -p /out \
    && cp target/release/obscura target/release/obscura-worker /out/

# distroless/cc: glibc, libgcc and CA certs, no shell and no package manager.
FROM gcr.io/distroless/cc-debian12

ARG OBSCURA_REPO
ARG OBSCURA_REVISION
ARG OBSCURA_VERSION

LABEL org.opencontainers.image.title="Norish Obscura" \
      org.opencontainers.image.description="Obscura headless browser, built with render+stealth, as shipped by Norish for URL imports." \
      org.opencontainers.image.version="${OBSCURA_VERSION}" \
      org.opencontainers.image.revision="${OBSCURA_REVISION}" \
      org.opencontainers.image.source="${OBSCURA_REPO}" \
      org.opencontainers.image.url="https://github.com/norish-recipes/Norish" \
      org.opencontainers.image.licenses="Apache-2.0"

COPY --from=builder /out/obscura /obscura
COPY --from=builder /out/obscura-worker /obscura-worker

# Apache-2.0 requires the licence and the attribution notice travel with the
# work; upstream's NOTICE lives in its README's credits.
COPY --from=builder /build/LICENSE /licenses/obscura/LICENSE
COPY --from=builder /build/README.md /licenses/obscura/README.md

EXPOSE 9222

# The whole command is the entrypoint, so stealth is a property of the image
# rather than of however an operator happens to start it. `--host 0.0.0.0` is
# what makes the port reachable from the Norish container; the binary's own
# default is loopback-only.
#
# Deliberately absent: `--allow-private-network`. Obscura blocks loopback,
# RFC1918 and link-local targets by default, which is the only thing standing
# between an authenticated URL import and the deployment's internal network.
ENTRYPOINT ["/obscura", "serve", "--host", "0.0.0.0", "--port", "9222", "--stealth"]
