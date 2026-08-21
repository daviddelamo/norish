# 02 — Mobile recipe header with the Glance Bar

**What to build:** a new header component for the phone, consumed by `recipe-page-mobile.tsx` and `shared-recipe-page-mobile.tsx`, rendering on the page background rather than inside a card: category chips, then the origin flag and title, then the author chip, then the description, then the **Glance Bar**, then the tags. The Glance Bar is total time · servings · calories — it restates facts the sections below own and holds none of its own. `ReadonlyRecipeSummary` is not touched, so `recipe-page-desktop.tsx` and `shared-recipe-page-desktop.tsx` keep rendering exactly as they do today.

Hero chrome moves onto the photo as opaque circular buttons — back top-left, favourite and `⋯` top-right — drawn as chrome surface plus border and shadow, never translucent (ADR-0020). The author chip comes off the photo. The "back to recipes" text row and the source icon glued to the title are both deleted; the source gets its own card in ticket 06.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The mobile header renders on the page background in the order: categories, flag + title, author, description, Glance Bar, tags
- [ ] Tags keep allergen-first sorting and the warning fill
- [ ] The Glance Bar shows total time, servings and calories, and omits any entry the recipe does not store
- [ ] Hiding Nutrition Information removes the calories entry; a recipe storing none of the three renders no bar at all
- [ ] Back, favourite and `⋯` float on the photo as opaque buttons with no `backdrop-blur` or see-through fill
- [ ] The author chip renders under the title, not on the photo
- [ ] The "back to recipes" row and the title's external-link icon are gone
- [ ] `ReadonlyRecipeSummary` is byte-for-byte unchanged and both desktop surfaces render as before
- [ ] Share-mobile renders the same header, with no favourite and no actions menu
