// The shared glass tokens are gone on purpose: Norish does not fake glass
// (ADR-0020), and their absence is the enforcement — with no token to reach
// for, re-adding blur means writing it out by hand, which the design
// invariants suite catches.

export const APP_MAIN_HORIZONTAL_PADDING_CLASS = "px-4 md:px-6";

export const hoverInputIcon =
  "w-5 h-5 text-muted group-hover:text-foreground group-focus-within:text-accent transition-colors";

// A control sitting on real media is solid near-black: it carries its own
// contrast instead of borrowing whatever plays underneath (ADR-0020).
export const cssMediaControl = "bg-neutral-900 text-white hover:bg-neutral-800";

// The soft accent halo behind an empty-state icon, drawn as a radial
// gradient rather than blur compositing (ADR-0020 removed blur outright).
export const cssEmptyStateGlow =
  "from-accent-soft0/20 dark:from-accent/15 absolute -inset-12 bg-radial from-40% to-transparent";

export const cssInputNoHover =
  "hover:!bg-white/70 dark:hover:!bg-black/70 data-[hovered=true]:!bg-white/70 dark:data-[hovered=true]:!bg-black/70 focus:!bg-white/70 dark:focus:!bg-black/70 data-[focus=true]:!bg-white/70 dark:data-[focus=true]:!bg-black/70 active:!bg-white/70 dark:active:!bg-black/70 data-[pressed=true]:!bg-white/70 dark:data-[pressed=true]:!bg-black/70 hover:!opacity-100 data-[hovered=true]:!opacity-100 transition-none";

export const cssInputNoHoverTransparent =
  "hover:!bg-transparent dark:hover:!bg-transparent data-[hovered=true]:!bg-transparent dark:data-[hovered=true]:!bg-transparent focus:!bg-transparent dark:focus:!bg-transparent data-[focus=true]:!bg-transparent dark:data-[focus=true]:!bg-transparent active:!bg-transparent dark:active:!bg-transparent data-[pressed=true]:!bg-transparent dark:data-[pressed=true]:!bg-transparent hover:!opacity-100 data-[hovered=true]:!opacity-100 transition-none";

export const cssButtonPill =
  "rounded-full data-[hovered=true]:bg-surface-tertiary data-[pressed=true]:bg-surface-tertiary";

export const cssButtonPillDanger =
  "rounded-full text-danger data-[hovered=true]:bg-danger/10 data-[pressed=true]:bg-danger/15";

// Dropdown/Menu item pill styling to unify hover/pressed across menus
// Uses important overrides to beat component defaults and keeps base transparent
export const cssMenuItemPill =
  "rounded-full bg-transparent data-[hovered=true]:!bg-surface-tertiary data-[pressed=true]:!bg-surface-tertiary data-[focus=true]:!bg-surface-tertiary";

// AI gradient text styling for menu items and labels
export const cssAIGradientText =
  "bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent";

// AI gradient background for buttons
export const cssAIGradientBg =
  "bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 text-white";

// AI icon color
export const cssAIIconColor = "text-fuchsia-500";

// MobileNav hides by shrinking in place rather than sliding away, so a hidden
// nav never vacates the corner. Everything that floats above it — the timer
// dock, the cook pill — therefore shrinks with it rather than dropping to the
// floor and landing on top of it.
export const MOBILE_NAV_SHRUNKEN_SCALE = 0.8;

// The phone's floating layer sits above the nav pill: the timer dock in the
// right corner and the cook pill in the left read the same offsets, so they
// rise and fall with the nav together instead of drifting apart. Both offsets
// are measured from the nav's own anchor, which is what makes the shrunken
// pair scale about the same point and stay aligned.
const FLOATING_DOCK_ABOVE_NAV_REM = 3.75;
export const cssFloatingDockBottomWithNav = `calc(max(env(safe-area-inset-bottom), 1rem) + ${FLOATING_DOCK_ABOVE_NAV_REM}rem)`;
export const cssFloatingDockBottomWithShrunkenNav = `calc(max(env(safe-area-inset-bottom), 1rem) + ${FLOATING_DOCK_ABOVE_NAV_REM * MOBILE_NAV_SHRUNKEN_SCALE}rem)`;
export const cssFloatingDockBottomDesktop = "1rem";

// The cook pill and the collapsed timer dock are the same object at opposite
// ends of the nav pill, so they are sized once here rather than twice by
// coincidence.
export const cssFloatingDockPill = "h-10 min-h-10 rounded-full px-4";
