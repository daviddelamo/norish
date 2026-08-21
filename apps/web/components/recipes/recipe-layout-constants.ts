export const MOBILE_RECIPE_MEDIA_HEIGHT_REM = 24;
export const MOBILE_RECIPE_MEDIA_HEIGHT_STYLE = `calc(${MOBILE_RECIPE_MEDIA_HEIGHT_REM}rem + env(safe-area-inset-top))`;

/**
 * Chrome floating on a recipe photo. It is a real object — chrome surface,
 * border, shadow — and never a pane of glass over the picture (ADR-0020).
 */
export const RECIPE_HERO_CHROME_BUTTON_CLASS =
  "bg-surface border-border text-foreground hover:bg-surface-secondary flex size-10 min-w-10 items-center justify-center rounded-full border shadow-md";

/**
 * Clear of the installed-PWA status bar fade the app shell draws — and of the
 * negative margins the recipe page uses to run its photo edge to edge, which
 * pull the overlay slot further up than its own `top-4` suggests.
 */
export const RECIPE_HERO_CHROME_OFFSET_CLASS = "mt-[calc(2.75rem+env(safe-area-inset-top))]";
