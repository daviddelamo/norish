# Landing screenshots

These JPGs are the source captures behind the tour deck. The page never reads
them directly; `pnpm --filter @norish/landing shots` renders them into
`public/screenshots/optimized` at the exact sizes `components/shot.tsx`
requests. After replacing any capture here, run that script and commit both.

## The capture spec

Every screen ships four captures, named `<screen>-<web|mobile>-<light|dark>.jpg`:

- **web**: 1800x1349 (a 900x675 logical viewport at 2x)
- **mobile**: 555x1100

The optimizer centre-crops anything with a different aspect and warns, because
a mismatched size almost always means the capture came from a different
session than the rest of the set.

## One instance, one story

All twenty captures must come from the same signed-in account on the same day,
so the deck reads as one household using one app. The current canonical state
is the "M" account with today = Tuesday, August 11:

- calendar: today holds the curry (breakfast) and the mussels spaghetti (dinner)
- cooking: cooking mode is open on that same curry, step 1 of 5
- groceries: the curry's ingredients under Dirk and Albert Heijn, the mussels'
  tomato frito ticked off, the weekly Coke recurring

**Known inconsistency (2026-08-12):** the `dashboard-*` and `recipe-*` captures
(all eight) are from an older session on a different instance: sheep avatar,
today = Friday, June 26, a mixed-language grid with one missing recipe image,
and a recipe page (bapao) that is not among that day's meals. They need
retaking from the canonical instance above. Suggestion: open the curry as the
recipe page, so the whole deck is one continuous story; dashboard shows today
with the curry on it, the recipe page is that curry, Cook is pressed on it,
the week holds it, and the grocery list carries its ingredients.

Retake checklist for that session:

- [ ] dashboard-web-light.jpg / dashboard-web-dark.jpg
- [ ] dashboard-mobile-light.jpg / dashboard-mobile-dark.jpg
- [ ] recipe-web-light.jpg / recipe-web-dark.jpg
- [ ] recipe-mobile-light.jpg / recipe-mobile-dark.jpg
- [ ] `pnpm --filter @norish/landing shots` reports no warnings

While retaking, keep the recipe grid free of placeholder tiles (every visible
recipe has a photo) and keep visible recipe titles in one language.
