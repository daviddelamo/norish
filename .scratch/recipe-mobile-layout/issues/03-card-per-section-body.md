# 03 — Card-per-section body in cooking order

**What to build:** replace the mobile page's single unified `Card` and its `<Separator />` rules with one card per section, in the order Ingredients → Steps → Notes → Cooking Time → Nutrition → Provenance → Source → Rating. The order is fixed: no drag handles are drawn and no reorder affordance exists. The Rating block moves out of the Steps section into a card of its own.

Card presence follows the rule the sections already implement (`useNutritionSectionVisible`, `useProvenanceSectionVisible`, `useNotesSectionVisible`): nothing stored and nothing running means no card, and a run in flight renders as working. Ingredients and Steps always render. This reverses on mobile only the recorded decision that Recipe Provenance precedes the ingredients — desktop keeps provenance where it is.

The Ingredients card header becomes a full-width `N servings − +` row (ticket 01 has already moved the other two controls out). "Add to groceries" stays at the foot of the Ingredients card.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Each section renders as its own card; no `<Separator />` rules remain between sections on mobile
- [ ] Card order is Ingredients, Steps, Notes, Cooking Time, Nutrition, Provenance, Source, Rating
- [ ] Rating renders as its own card and no longer inside the Steps section
- [ ] A card whose section has nothing stored and nothing running does not render; a section with a run in flight renders as working
- [ ] Ingredients and Steps always render, including for a recipe that has neither
- [ ] The Ingredients card header is a full-width servings row
- [ ] A bare recipe (no times, calories, source, notes, provenance) renders as a shorter page with no empty boxes
- [ ] `recipe-page-desktop.tsx` is unchanged, provenance included
