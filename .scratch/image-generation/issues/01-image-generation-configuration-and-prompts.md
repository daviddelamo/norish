# 01 — Image Generation configuration and its two Prompts

Status: ready-for-agent
Blocked by: None — can start immediately

Spec: `.scratch/image-generation/spec.md`

## What to build

An administrator can point Norish at an image provider and tune what it draws. A new Image Generation block in the AI settings holds provider, model, endpoint and key, and its provider list offers only providers that can actually generate images. Two new administrator-editable Prompts join the set: the visual brief and the image style. Nothing generates an image yet — ticket 03 teaches the runtime to call a provider, ticket 05 wires it to a recipe.

## Notes

The provider list is restricted to OpenAI, Google, Azure, LM Studio and the generic OpenAI-compatible endpoint. Anthropic, Mistral, DeepSeek, Groq, Perplexity and Ollama expose no image model in the installed AI SDK line (ADR-0024). That is a fact about which provider packages expose an image model, not a claim about any model's behaviour — re-check it when the AI SDK line moves.

Endpoint and key fall back to the AI configuration when the provider matches, exactly as the transcription block already does. There is deliberately no image-generation timeout: the existing AI timeout governs it (ADR-0015).

Two Prompts, not one, because the feature makes two requests. Both are appended to rather than interpolated (ADR-0016), both join the shipped defaults, and both need the retired-defaults set regenerated — there is a test that fails when that is forgotten.

The `imageGeneration` automatic switch belongs to this ticket too, defaulting **off**: an upgrade must never silently start spending. The coordinator reads it in ticket 05.

The glossary now says there are eleven Prompts. If that does not match reality when this ticket lands, one of the two is wrong.

## Acceptance criteria

- [ ] An Image Generation configuration block stores provider, model, endpoint and key, and ships unconfigured.
- [ ] The provider list offers only providers that expose an image model; the others cannot be selected.
- [ ] Endpoint and key fall back to the AI configuration when the provider matches, and do not when it differs.
- [ ] There is no image-generation timeout setting; the existing AI timeout applies.
- [ ] An `imageGeneration` automatic switch joins the automatic enrichment configuration and defaults off.
- [ ] Two new Prompts ship with defaults, are editable by an administrator, and are stored as overrides only.
- [ ] The retired-prompt-defaults set is regenerated and its guard test passes.
- [ ] Saving the block round-trips through the admin form without discarding an unchanged key.
