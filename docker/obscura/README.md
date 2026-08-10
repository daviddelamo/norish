# Norish Obscura image

Norish renders JavaScript-heavy recipe pages before parsing them. That rendering
happens in [Obscura](https://github.com/h4ckf0r0day/obscura), a Rust headless
browser that speaks the Chrome DevTools Protocol, running as its own container
beside the application. The Norish server connects to it over
`OBSCURA_ENDPOINT`; it is the only rendered-page engine, with no Chrome fallback.

This directory builds and publishes the image the shipped Compose examples use.

## Why Norish ships its own image

Upstream publishes `h4ckf0r0day/obscura`, but Norish does not use it:

- **Stealth is half a feature without the build.** Obscura's anti-detection
  behaviour is a `stealth` cargo feature *and* a `--stealth` runtime flag.
  Upstream's Dockerfile compiles `render` only, so its image accepts the flag
  while the stealth transport — the TLS fingerprint an anti-bot check sees
  first — was never compiled in. Upstream's *release archives* do ship a
  render+stealth build, one per platform with a `-stealth` suffix, and that is
  what this image takes.
- **A release has to be able to name its browser.** The upstream image tags
  move, and release assets can be replaced in place, so the archive is pinned by
  SHA-256 rather than by version alone.
- **Stealth is not optional at runtime.** The whole command is the image's
  `ENTRYPOINT`, so the CDP server always starts with `--stealth`. There is no
  plain mode and no second service.

`--allow-private-network` is deliberately absent everywhere. Obscura blocks
loopback, RFC1918 and link-local targets by default — including at DNS
resolution time — and that default is what keeps an authenticated URL import
from reaching the deployment's own network.

There is no compile here. The build fetches the published `-stealth` archive for
the target architecture, checks it against the recorded digest, and copies the
two binaries into `distroless/cc` (glibc 2.36, against a binary built for 2.35).

## The pin

`pin.env` records the upstream release, the commit it was cut from, each
architecture's archive digest, and the immutable image tag — together, so a
release can prove what it contains. `verify-pin.sh` checks that the Dockerfile's
`ARG` defaults still match it, that every active surface quotes that exact image
tag, and with `--registry` that the tag is published as a manifest covering both
architectures:

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

1. Get the digests for the release you want:

   ```bash
   v=0.2.1
   for arch in x86_64 aarch64; do
     curl -sSL "https://github.com/h4ckf0r0day/obscura/releases/download/v$v/obscura-$arch-linux-stealth.tar.gz" \
       | shasum -a 256 | sed "s|-|$arch|"
   done
   ```

2. Update `OBSCURA_VERSION`, `OBSCURA_REVISION` (the commit the tag was cut
   from), both `OBSCURA_SHA256_*` values and `OBSCURA_IMAGE_TAG` in `pin.env`,
   and the matching `ARG` defaults in `Dockerfile`. `verify-pin.sh` fails if the
   two drift.
3. Run the workflow.
4. Update the image tag in every Compose surface — `docker/compose.base.yaml`,
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
  --build-arg "OBSCURA_SHA256_AMD64=$OBSCURA_SHA256_AMD64" \
  --build-arg "OBSCURA_SHA256_ARM64=$OBSCURA_SHA256_ARM64" \
  -t "norishapp/obscura:$OBSCURA_IMAGE_TAG"
```

## Licensing

Obscura is Apache-2.0, with no NOTICE file upstream. The image carries its
`LICENSE` and `README.md` (which holds the credits) under `/licenses/obscura/`,
fetched at the pinned commit, and the build records
`org.opencontainers.image.source`, `.revision` and `.licenses` as OCI labels.

One gap worth knowing about: the binaries are statically linked Rust builds
whose dependency tree carries its own attribution requirements (several crates
are MIT, which asks that its notice travel with binary copies). Upstream ships
no bundled third-party licence file with its releases, and we cannot generate
one without the source tree, so the image does not carry one either. Raising it
upstream is the fix.
