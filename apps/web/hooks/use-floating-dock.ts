"use client";

import { useAutoHide } from "@/hooks/auto-hide";
import { useIsMobile } from "@/hooks/use-is-mobile";

import {
  cssFloatingDockBottomDesktop,
  cssFloatingDockBottomWithNav,
  cssFloatingDockBottomWithShrunkenNav,
  MOBILE_NAV_SHRUNKEN_SCALE,
} from "@norish/web/config/css-tokens";

type FloatingDockOptions = {
  /** Which end of the nav pill this dock keeps station over. */
  align: "start" | "end";
  /** Hold the dock at full size whatever the nav does, e.g. while expanded. */
  disabled?: boolean;
};

/**
 * Geometry for anything floating above `MobileNav`, in one place so the timer
 * dock and the cook pill cannot drift apart.
 *
 * The nav hides by shrinking in place rather than sliding away, so it never
 * vacates the corner and a dock that dropped to the floor would land on top of
 * it. The dock keeps its station above the bar instead and takes the bar's own
 * shrink about the bar's own anchor — slightly smaller, slightly further in —
 * which is what keeps the two aligned at either size.
 */
export function useFloatingDock({ align, disabled = false }: FloatingDockOptions) {
  const isMobile = useIsMobile();
  const { isVisible } = useAutoHide({ disabled });

  const isShrunken = isMobile && !isVisible;

  return {
    isNavVisible: isVisible,
    /**
     * The row spans the viewport so the shrink pivots on the same centre the
     * nav's does; only the pill inside it takes pointer events.
     */
    className: `pointer-events-none fixed inset-x-0 flex px-4 ${
      align === "end" ? "justify-end" : "justify-start"
    }`,
    style: {
      bottom: isMobile ? cssFloatingDockBottomWithNav : cssFloatingDockBottomDesktop,
      originY: 1,
    },
    animate: isMobile
      ? {
          bottom: isShrunken ? cssFloatingDockBottomWithShrunkenNav : cssFloatingDockBottomWithNav,
          scale: isShrunken ? MOBILE_NAV_SHRUNKEN_SCALE : 1,
        }
      : {},
    transition: { duration: 0.25, ease: "easeInOut" as const },
  };
}
