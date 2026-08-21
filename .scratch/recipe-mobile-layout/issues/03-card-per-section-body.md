# 03 — Card-per-section body in cooking order

**What to build:** replace the mobile page's single unified `Card` and its `<Separator />` rules with one card per section, in the order Ingredients → Steps → Notes → Cooking Time → Nutrition → Provenance → Source → Rating. The order is fixed: no drag handles are drawn and no reorder affordance exists. The Rating block moves out of the Steps section into a card of its own.

Card presence follows the rule the sections already implement (`useNutritionSectionVisible`, `useProvenanceSectionVisible`, `useNotesSectionVisible`): nothing stored and nothing running means no card, and a run in flight renders as working. Ingredients and Steps always render. This reverses on mobile only the recorded decision that Recipe Provenance precedes the ingredients — desktop keeps provenance where it is.

The Ingredients card header becomes a full-width `N servings − +` row (ticket 01 has already moved the other two controls out). "Add to groceries" stays at the foot of the Ingredients card.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [x] Each section renders as its own card; no `<Separator />` rules remain between sections on mobile
- [x] Card order is Ingredients, Steps, Notes, Cooking Time, Nutrition, Provenance, Source, Rating
- [x] Rating renders as its own card and no longer inside the Steps section
- [x] A card whose section has nothing stored and nothing running does not render; a section with a run in flight renders as working
- [x] Ingredients and Steps always render, including for a recipe that has neither
- [x] The Ingredients card header is a full-width servings row
- [x] A bare recipe (no times, calories, source, notes, provenance) renders as a shorter page with no empty boxes
- [x] `recipe-page-desktop.tsx` is unchanged, provenance included

**Amended after review:** the servings row draws no box of its own. The
Ingredients card is already the edge, and an outline inside an outline read as
a form field rather than as the one control on the card worth hitting without
looking. What is drawn instead is the stepper: `−` and `+` as two halves of one
filled segment pair.

- [x] The servings row has no border; the `−` / `+` pair is one filled segmented control

**Amended again after review:** every amount the servings row scales rolls to
its new value rather than being repainted, so a reader can see that the figure
moved rather than that the page redrew. Readers who ask for less motion get the
plain swap.

- [x] Ingredient amounts and the servings count transition when they change
- [x] `prefers-reduced-motion` renders the swap without animation
