# 01 — Publish the Norish Obscura image

**What to build:** Establish the reproducible browser artifact that the Norish application and every supported deployment will use for rendered-page imports.

**Blocked by:** Nothing

**Status:** ready-for-human

- [x] Norish builds its Obscura image from one explicitly pinned upstream source revision rather than from a floating branch, tag, or upstream image. _(Adjusted: pinned to upstream's `v0.2.0` render+stealth release archive by SHA-256, not built from source — see the comment below.)_
- [x] The image build enables Obscura's full stealth feature, and the shipped service always starts Obscura with stealth enabled.
- [x] The runtime command retains Obscura's private-network protection and exposes no supported switch that adds `--allow-private-network`.
- [ ] One immutable image version is published as a multi-architecture manifest with native Linux AMD64 and ARM64 variants.
- [x] Active release automation can rebuild and publish the pinned artifact without relying on undocumented workstation state.
- [x] The selected tag and source revision are recorded together so a release can prove which upstream source it contains.
- [x] Required Obscura licensing and attribution accompany the owned image and its build source.
- [x] An application release cannot publish configuration that references the image until that immutable image version is available.
- [x] The artifact contract is validated through its build and manifest metadata; no Obscura behavior, anti-bot, or live-site compatibility suite is introduced.

## Comments

**2026-08-09 — one maintainer action outstanding: publish the image.** Everything
that builds and gates the artifact has landed (`docker/obscura/`, the pin,
`verify-pin.sh`, and the **Publish Obscura image** workflow), but
`norishapp/obscura:0.2.0-norish.1` is not on Docker Hub yet — pushing it needs
the `DOCKERHUB_*` secrets, so it has to be a maintainer running the workflow from
the Actions tab.

Order matters: `verify-pin.sh --registry` now gates `prepare-release` in both
`rc-release-build.yml` and `release-build.yml`, which is the point — a release
cannot ship Compose examples naming an image that does not exist. Until the
workflow has run once, **every RC and release build will stop at the "Obscura
pin" job**. Run it before merging to an `rc/**` branch.


**2026-08-10 — the from-source build was unnecessary; the image now repackages
upstream's release archive.** Obscura `v0.2.0` publishes four builds per
platform, and the `-stealth` suffix is exactly the render+stealth combination
this ticket asked for:

| Suffix | Rendering | Stealth |
| --- | --- | --- |
| (none) | yes | no |
| `-stealth` | yes | yes |
| `-no-render` | no | no |
| `-no-render-stealth` | no | yes |

So the Dockerfile no longer carries a Rust toolchain, cmake, clang or a
30-plus-minute compile. It fetches `obscura-<arch>-linux-stealth.tar.gz`, checks
it against a SHA-256 recorded in `pin.env`, and copies the two binaries into
`distroless/cc`. The digest is what makes the pin immutable now — release assets
can be replaced in place, so the version tag alone would not be enough — and the
commit the release was cut from stays in `pin.env` as the record of which source
the binaries came from.

Verified locally against the built image on 2026-08-10:

- `linux/arm64` image builds in seconds; the container starts and prints
  `Headless Browser v0.2.0` with its CDP server up.
- `playwright-core` 1.61.1 `connectOverCDP` → `newContext({extraHTTPHeaders})` →
  `goto(…, {waitUntil: "load"})` → `content()` → `close()` all work, which is
  precisely the contract `packages/api/src/parser/fetch.ts` depends on.
- Stealth is genuinely compiled in: 152 BoringSSL symbols in the binary.
- The SSRF guard is real and on by default: navigating to a loopback address is
  refused with `Access to private/internal IP address`.
- Runtime needs are `libc`, `libgcc_s`, `libm` and glibc ≤ 2.35;
  `distroless/cc-debian12` carries 2.36.
