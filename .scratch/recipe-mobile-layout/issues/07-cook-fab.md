# 07 — Floating cook button

**What to build:** move cooking mode's entry point out of the content flow and into a floating pill in the phone's **bottom-left**, mirroring `TimerDock`'s corner across the nav pill. It adopts the timer dock's existing rise-and-fall with `MobileNav` visibility (`bottomWhenNavVisible` / `bottomWhenNavHidden`) so it never covers the nav, and it must never overlap a running timer.

It always reads "Cook". There is no persisted Cooking Session, so there is nothing to continue. The inline `<CookingMode fullWidth />` leaves `recipe-page-mobile.tsx`; desktop keeps its inline button. Share-mobile gets no cook button.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] A floating cook pill sits bottom-left and opens cooking mode
- [ ] It tracks `MobileNav` visibility the way `TimerDock` already does
- [ ] It never overlaps the nav pill or the timer dock, with one timer running and with several
- [ ] It reads "Cook" always, and never "Continue"
- [ ] The inline cooking-mode button is gone from the mobile page and still present on desktop
- [ ] Share-mobile renders no cook button
