# 03 — The AI Runtime can generate an image

Status: ready-for-agent
Blocked by: 01

Spec: `.scratch/image-generation/spec.md`

## What to build

The AI Runtime gains a third entry point beside structured generation and transcription. Given a Prompt name and appended sections it returns image bytes from the configured image provider, or a typed error that says whether retrying is worth it. Nothing calls it from a recipe yet.

## Notes

ADR-0024 is the decision this implements. The third entry point is a deliberate amendment to ADR-0015's "two entry points, because Norish makes two genuinely different kinds of request" — image generation takes no schema, returns bytes, and leaves the structured-output strategy nothing to parse.

Image model construction lives beside language-model and transcription construction, inside the provider boundary and on the shared transport. No feature constructs a provider client, and no feature passes a finished prompt string (ADR-0016).

The provider is asked for its widest supported landscape. Providers differ in whether they accept a size or an aspect ratio, and the widest landscape differs between them. Cropping to the stored size is ticket 02's job, not this one's.

Errors follow the existing classification rather than a new one: AI disabled and a missing or invalid image configuration never retry, a provider refusal never retries, an empty or unusable response always retries, and provider failures follow the SDK's own retryability.

## Acceptance criteria

- [ ] The runtime exposes an image-generation entry point beside structured generation and transcription.
- [ ] It reads the Image Generation configuration, not the AI configuration's provider.
- [ ] It refuses non-retryably when AI is disabled and when no image provider is configured.
- [ ] A provider refusal is non-retryable; an empty or unusable response is retryable.
- [ ] The request runs on the shared transport under the existing AI timeout.
- [ ] One log line per request records provider, model and feature.
- [ ] Covered by a runtime test against the fake AI provider, beside the existing transcription runtime test.
