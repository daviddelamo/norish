# Norish Obscura image

Norish renders JavaScript-heavy recipe pages before parsing them. That rendering
happens in [Obscura](https://github.com/h4ckf0r0day/obscura), a Rust headless
browser that speaks the Chrome DevTools Protocol, running as its own container
beside the application. The Norish server connects to it over
`OBSCURA_ENDPOINT`; it is the only rendered-page engine, with no Chrome fallback.

This directory builds and publishes the image the shipped Compose examples use.

## Why Norish builds its own

Upstream publishes `h4ckf0r0day/obscura`, but Norish does not use it:

- **Stealth is half a feature without the build.** Obscura's anti-detection
  behaviour is a `stealth` cargo feature *and* a `--stealth` runtime flag.
  Upstream's Dockerfile compiles `render` only, so its image accepts the flag
  while the stealth transport — the TLS fingerprint an anti-bot check sees
  first — was never compiled in. This image builds `render,stealth`.
- **A release has to be able to name its browser.** The upstream image tags
  move. `Dockerfile` builds one pinned commit and asserts the checkout landed
  on it, so rebuilding a Norish release cannot silently pick up different
  browser source.
- **Stealth is not optional at runtime.** The whole command is the image's
  `ENTRYPOINT`, so the CDP server always starts with `--stealth`. There is no
  plain mode and no second service.

`--allow-private-network` is deliberately absent everywhere. Obscura blocks
loopback, RFC1918 and link-local targets by default — including at DNS
resolution time — and that default is what keeps an authenticated URL import
from reaching the deployment's own network.

## The pin

`pin.env` records the upstream revision and the immutable tag it was published
under, together, so a release can prove what it contains. `verify-pin.sh` checks
that every active surface quotes that exact tag, and with `--registry` that the
tag is published as a manifest covering both architectures:

```bash
./docker/obscura/verify-pin.sh --registry
```

The RC and release workflows run it before they tag anything, so an application
release cannot ship Compose examples pointing at an image that does not exist.

## Publishing a new build

Run the **Publish Obscura image** workflow
(`.github/workflows/obscura-image.yml`) from the Actions tab. It builds
`linux/amd64` and `linux/arm64` on native runners, refuses to overwrite a tag
that already exists, and assembles the multi-architecture manifest.

To move to a newer Obscura:

1. Update `OBSCURA_VERSION`, `OBSCURA_REVISION` and `OBSCURA_IMAGE_TAG` in
   `pin.env`, and the matching `ARG` defaults in `Dockerfile`.
2. Run the workflow.
3. Update the image tag in every Compose surface — `docker/compose.base.yaml`,
   `docker/docker-compose.example.yml`, `docker/docker-compose.test.yml`, the
   README Quick Start, `apps/docs/src/components/QuickStartCompose.tsx`, the
   docs Quick Start, and `apps/landing/components/sections/self-host-compose.tsx`.
   `verify-pin.sh` lists whatever you miss.

Building it locally is the same build the workflow runs, minus the publish:

```bash
set -a; . docker/obscura/pin.env; set +a
docker build docker/obscura \
  --build-arg "OBSCURA_REPO=$OBSCURA_REPO" \
  --build-arg "OBSCURA_REVISION=$OBSCURA_REVISION" \
  --build-arg "OBSCURA_VERSION=$OBSCURA_VERSION" \
  -t "norishapp/obscura:$OBSCURA_IMAGE_TAG"
```

It compiles Obscura from source, so expect it to take a while.

## Licensing

Obscura is Apache-2.0. The image carries upstream's `LICENSE` and `README.md`
(which holds its attribution and credits) under `/licenses/obscura/`, and the
build records `org.opencontainers.image.source`, `.revision` and `.licenses` as
OCI labels.
